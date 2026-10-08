import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import Stripe from "stripe";

async function guard() {
  const store = await cookies();
  return isAdminToken(store.get(ADMIN_COOKIE)?.value);
}

const SECRET_KEYS = ["secret", "webhook"] as const;
const PRICE_KEYS = ["price_essencial", "price_completo", "price_vitalicio"] as const;

function mask(v: string | null): { set: boolean; last4: string } {
  if (!v) return { set: false, last4: "" };
  return { set: true, last4: v.slice(-4) };
}

// GET -> config atual com segredos MASCARADOS (nunca o valor completo)
export async function GET() {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data } = await supabase.from("settings").select("key, value");
  const map = new Map((data || []).map((r) => [r.key as string, r.value as string]));
  const mode = map.get("stripe_mode") === "live" ? "live" : "test";
  const block = (pfx: string) => ({
    secret: mask(map.get(`stripe_${pfx}_secret`) || null),
    webhook: mask(map.get(`stripe_${pfx}_webhook`) || null),
    price_essencial: map.get(`stripe_${pfx}_price_essencial`) || "",
    price_completo: map.get(`stripe_${pfx}_price_completo`) || "",
    price_vitalicio: map.get(`stripe_${pfx}_price_vitalicio`) || "",
  });
  return NextResponse.json({ mode, test: block("test"), live: block("live") });
}

const ALLOWED = new Set([
  "stripe_mode",
  "stripe_test_secret",
  "stripe_live_secret",
  "stripe_test_webhook",
  "stripe_live_webhook",
  "stripe_test_price_essencial",
  "stripe_test_price_completo",
  "stripe_test_price_vitalicio",
  "stripe_live_price_essencial",
  "stripe_live_price_completo",
  "stripe_live_price_vitalicio",
]);

// PUT { mode?, values: { key: value } } — valores vazios mantêm o atual
export async function PUT(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { mode, values } = (await req.json().catch(() => ({}))) as {
    mode?: string;
    values?: Record<string, string>;
  };
  const supabase = createServiceClient();
  if (mode === "test" || mode === "live") {
    await supabase
      .from("settings")
      .upsert({ key: "stripe_mode", value: mode, updated_at: new Date().toISOString() });
  }
  for (const [k, v] of Object.entries(values || {})) {
    if (!ALLOWED.has(k)) continue;
    const clean = (v || "").trim();
    if (!clean) continue; // vazio = mantém
    await supabase
      .from("settings")
      .upsert({ key: k, value: clean, updated_at: new Date().toISOString() });
  }
  return NextResponse.json({ ok: true });
}

// POST /api/admin/payments/test { mode } -> valida a chave salva (só leitura)
export async function POST(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { mode } = (await req.json().catch(() => ({}))) as { mode?: string };
  if (mode !== "test" && mode !== "live") {
    return NextResponse.json({ error: "modo inválido" }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", `stripe_${mode}_secret`)
    .single();
  const key = data?.value || (mode === "live" ? process.env.STRIPE_SECRET_KEY || "" : "");
  if (!key) {
    return NextResponse.json({ error: `chave ${mode} não configurada` }, { status: 400 });
  }
  try {
    const stripe = new Stripe(key, { apiVersion: "2026-09-30.endive" });
    const prices = await stripe.prices.list({ limit: 3 });
    return NextResponse.json({
      ok: true,
      mode,
      live: key.startsWith("sk_live_"),
      prices: prices.data.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "falha na Stripe" },
      { status: 400 }
    );
  }
}

export { SECRET_KEYS, PRICE_KEYS };

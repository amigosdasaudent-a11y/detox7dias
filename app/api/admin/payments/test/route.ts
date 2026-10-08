import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import Stripe from "stripe";

// POST /api/admin/payments/test { mode } -> valida a chave salva (só leitura)
export async function POST(req: Request) {
  const store = await cookies();
  if (!isAdminToken(store.get(ADMIN_COOKIE)?.value)) {
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
  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_") && !key.startsWith("rk_")) {
    return NextResponse.json(
      { error: "isso não parece uma secret key (use sk_test_... ou sk_live_..., nunca pk_...)" },
      { status: 400 }
    );
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

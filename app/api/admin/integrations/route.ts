import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { evoQr, evoSendText, evoStatus, getEvoConfig } from "@/lib/evolution";

async function guard() {
  const store = await cookies();
  return isAdminToken(store.get(ADMIN_COOKIE)?.value);
}

function mask(v: string | null): { set: boolean; last4: string } {
  if (!v) return { set: false, last4: "" };
  return { set: true, last4: v.slice(-8) };
}

const ALLOWED = new Set(["evo_url", "evo_key", "evo_instance", "openai_key"]);

// GET -> credenciais mascaradas + estado da conexão
export async function GET() {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data } = await supabase.from("settings").select("key, value");
  const map = new Map((data || []).map((r) => [r.key as string, r.value as string]));
  const out: Record<string, unknown> = {
    evo_url: map.get("evo_url") || "",
    evo_key: mask(map.get("evo_key") || null),
    evo_instance: map.get("evo_instance") || "",
    openai: { set: !!map.get("openai_key") },
  };
  try {
    const cfg = await getEvoConfig();
    const st = await evoStatus(cfg);
    out.evo_state = st.connected && st.loggedIn ? "open" : "desconectado";
    out.evo_name = st.name;
  } catch (e) {
    out.evo_state = "desconectado";
    out.evo_error = e instanceof Error ? e.message : "falha";
  }
  return NextResponse.json(out);
}

// PUT { values } — vazio mantém (exceto mesmos princípios das outras telas)
export async function PUT(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { values } = (await req.json().catch(() => ({}))) as {
    values?: Record<string, string>;
  };
  const supabase = createServiceClient();
  for (const [k, v] of Object.entries(values || {})) {
    if (!ALLOWED.has(k)) continue;
    const clean = (v || "").trim().replace(/\/$/, "");
    if (!clean) continue;
    await supabase
      .from("settings")
      .upsert({ key: k, value: k === "evo_url" ? clean : v.trim(), updated_at: new Date().toISOString() });
  }
  return NextResponse.json({ ok: true });
}

// POST { action: 'qr' | 'send', to?, text? }
export async function POST(req: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const { action, to, text } = (await req.json().catch(() => ({}))) as {
    action?: string;
    to?: string;
    text?: string;
  };
  try {
    const cfg = await getEvoConfig();
    if (action === "qr") {
      try {
        const qr = await evoQr(cfg);
        return NextResponse.json({ base64: qr.base64 || null });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        // Já pareado: QR desnecessário = conectado
        if (/already logged in/i.test(msg)) {
          return NextResponse.json({ connected: true });
        }
        throw e;
      }
    }
    if (action === "send") {
      if (!to || !text) return NextResponse.json({ error: "número/texto?" }, { status: 400 });
      await evoSendText(cfg, to, text);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "ação inválida" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "falha Evolution" },
      { status: 400 }
    );
  }
}

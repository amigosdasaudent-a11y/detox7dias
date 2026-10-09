import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/novidades -> { subscribed, name?, phone? }
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });
  const { data } = await supabase
    .from("subscribers")
    .select("name, phone, active")
    .eq("user_id", user.id)
    .single();
  if (!data || !data.active) return NextResponse.json({ subscribed: false });
  return NextResponse.json({ subscribed: true, name: data.name, phone: data.phone });
}

// POST /api/novidades { name, phone } -> opt-in (atualiza se existir)
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });
  const { name, phone } = (await req.json().catch(() => ({}))) as {
    name?: string;
    phone?: string;
  };
  const cleanName = String(name || "").trim().slice(0, 80);
  const cleanPhone = String(phone || "").replace(/\D/g, "").slice(0, 15);
  if (cleanName.length < 2) {
    return NextResponse.json({ error: "informe seu nome" }, { status: 400 });
  }
  if (cleanPhone.length < 10) {
    return NextResponse.json({ error: "celular inválido (use DDD+numero)" }, { status: 400 });
  }
  const { error } = await supabase.from("subscribers").upsert(
    { user_id: user.id, name: cleanName, phone: cleanPhone, active: true },
    { onConflict: "user_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/novidades -> sair (opt-out LGPD)
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login necessário" }, { status: 401 });
  await supabase.from("subscribers").update({ active: false }).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}

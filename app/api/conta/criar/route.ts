import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Cadastro de conta GRÁTIS (sem pagamento).
// Cria o usuário já confirmado para o cliente entrar direto e ver a vitrine.
export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "dados inválidos" }, { status: 400 });
  }

  const email = (body.email || "").toLowerCase().trim();
  const password = body.password || "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 6) {
    return NextResponse.json(
      { error: "Informe um e-mail válido e senha de pelo menos 6 caracteres." },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const already = existing?.users?.find((u) => (u.email || "").toLowerCase() === email);
  if (already) {
    return NextResponse.json(
      { error: "Este e-mail já tem conta. Faça login." },
      { status: 409 }
    );
  }

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    const msg = /already|registered|exists/i.test(error.message)
      ? "Este e-mail já tem conta. Faça login."
      : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

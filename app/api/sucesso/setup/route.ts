import { NextResponse } from "next/server";
import { getStripe, getStripeConfig, planFromPriceId } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

// POST /api/sucesso/setup { session_id, password }
// Verifica na Stripe que a sessão foi PAGA e define a senha do dono do e-mail.
// Dispensa o e-mail de convite: a prova é a própria sessão de pagamento.
export async function POST(req: Request) {
  const { session_id, password } = (await req.json().catch(() => ({}))) as {
    session_id?: string;
    password?: string;
  };
  if (!session_id || !password || password.length < 6) {
    return NextResponse.json({ error: "dados inválidos (senha: 6+ caracteres)" }, { status: 400 });
  }

  let cfg;
  try {
    cfg = await getStripeConfig();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "stripe não configurado" },
      { status: 500 }
    );
  }
  const stripe = getStripe(cfg.secretKey);

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items.data.price"],
    });
  } catch {
    return NextResponse.json({ error: "sessão não encontrada" }, { status: 400 });
  }

  const paid =
    session.payment_status === "paid" ||
    (session.mode === "subscription" && session.status === "complete");
  if (!paid) {
    return NextResponse.json({ error: "pagamento ainda não confirmado" }, { status: 402 });
  }

  const email = (session.customer_details?.email || session.customer_email || "")
    .toLowerCase()
    .trim();
  if (!email) return NextResponse.json({ error: "sessão sem e-mail" }, { status: 400 });

  const priceId = session.line_items?.data?.[0]?.price?.id;
  const plan =
    planFromPriceId(priceId, cfg.prices) ||
    (session.metadata?.plan && ["essencial", "completo", "vitalicio"].includes(session.metadata.plan)
      ? session.metadata.plan
      : "essencial");

  const supabase = createServiceClient();
  const { data: existing } = await supabase.auth.admin.listUsers();
  let userId = existing.users.find((u) => (u.email || "").toLowerCase() === email)?.id;

  if (userId) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    userId = created.user.id;
  }

  // Garante a liberação (o webhook faz o mesmo; onConflict evita duplicar)
  const { error: entErr } = await supabase.from("entitlements").upsert(
    {
      user_id: userId,
      email,
      stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
      stripe_session_id: session.id,
      plan,
      status: "active",
      expires_at: null,
    },
    { onConflict: "stripe_session_id" }
  );
  if (entErr) return NextResponse.json({ error: entErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, email });
}

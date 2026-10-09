import { NextResponse } from "next/server";
import { getStripe, getStripeConfig } from "@/lib/stripe";
import { getSetting } from "@/lib/settings";

// POST /api/checkout { plan: 'essencial'|'completo'|'vitalicio', email? }
export async function POST(req: Request) {
  const { plan, email } = (await req.json().catch(() => ({}))) as {
    plan?: string;
    email?: string;
  };
  let cfg;
  try {
    cfg = await getStripeConfig();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "stripe não configurado" },
      { status: 500 }
    );
  }
  const price = plan && cfg.prices[plan];
  // Override manual do admin: link fixo por plano (vazio = gera checkout automático)
  if (plan && ["essencial", "completo", "vitalicio"].includes(plan)) {
    const custom = await getSetting(`sales_link_${plan}`);
    if (custom) return NextResponse.json({ url: custom, manual: true });
  }
  if (!price) {
    return NextResponse.json(
      { error: `Plano inválido ou preço (${cfg.mode}) não configurado (plan=${plan})` },
      { status: 400 }
    );
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const stripe = getStripe(cfg.secretKey);
  // Preço recorrente exige mode subscription; one-time usa payment
  const priceObj = await stripe.prices.retrieve(price);
  const mode = priceObj.recurring ? "subscription" : "payment";
  const session = await stripe.checkout.sessions.create({
    mode,
    line_items: [{ price, quantity: 1 }],
    customer_email: email || undefined,
    success_url: `${site}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/#planos`,
    metadata: { plan: plan! },
  });
  return NextResponse.json({ url: session.url, mode: cfg.mode });
}

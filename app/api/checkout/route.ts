import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

const PRICE_BY_PLAN: Record<string, string | undefined> = {
  essencial: process.env.STRIPE_PRICE_ESSENCIAL,
  completo: process.env.STRIPE_PRICE_COMPLETO,
  vitalicio: process.env.STRIPE_PRICE_VITALICIO,
};

// POST /api/checkout { plan: 'essencial'|'completo'|'vitalicio', email? }
export async function POST(req: Request) {
  const { plan, email } = (await req.json().catch(() => ({}))) as {
    plan?: string;
    email?: string;
  };
  const price = plan && PRICE_BY_PLAN[plan];
  if (!price) {
    return NextResponse.json(
      { error: `Plano inválido ou STRIPE_PRICE_* não configurado (plan=${plan})` },
      { status: 400 }
    );
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const stripe = getStripe();
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
  return NextResponse.json({ url: session.url });
}

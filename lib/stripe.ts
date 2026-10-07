import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-09-30.endive",
    });
  }
  return _stripe;
}

// Mapeia Price ID -> plano do banco (pagamento único)
export function planFromPriceId(priceId: string | null | undefined): string {
  if (priceId === process.env.STRIPE_PRICE_VITALICIO) return "vitalicio";
  if (priceId === process.env.STRIPE_PRICE_COMPLETO) return "completo";
  return "essencial";
}

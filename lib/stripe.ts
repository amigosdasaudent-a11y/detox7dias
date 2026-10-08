import Stripe from "stripe";
import { getSettings } from "./settings";

export type StripeMode = "test" | "live";

export type StripeConfig = {
  mode: StripeMode;
  secretKey: string;
  webhookSecret: string;
  prices: Record<string, string>;
};

const PRICE_KEYS = ["essencial", "completo", "vitalicio"] as const;

// Config efetiva: settings (admin) tem prioridade; env é o fallback.
export async function getStripeConfig(): Promise<StripeConfig> {
  const s = await getSettings([
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

  const mode: StripeMode =
    s.stripe_mode === "live" || s.stripe_mode === "test"
      ? s.stripe_mode
      : process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
        ? "live"
        : "test";

  const pfx = mode === "live" ? "stripe_live" : "stripe_test";
  const prices: Record<string, string> = {};
  for (const p of PRICE_KEYS) {
    prices[p] =
      s[`${pfx}_price_${p}`] || process.env[`STRIPE_PRICE_${p.toUpperCase()}`] || "";
  }

  const secretKey = s[`${pfx}_secret`] || (mode === "live" ? process.env.STRIPE_SECRET_KEY || "" : "");
  if (!secretKey) {
    throw new Error(`Chave Stripe (${mode}) não configurada. Ajuste em /admin/pagamentos.`);
  }
  const webhookSecret =
    s[`${pfx}_webhook`] || (mode === "live" ? process.env.STRIPE_WEBHOOK_SECRET || "" : "");

  return { mode, secretKey, webhookSecret, prices };
}

export function getStripe(secretKey: string): Stripe {
  return new Stripe(secretKey, { apiVersion: "2026-09-30.endive" });
}

// Mapeia Price ID -> plano. null = preço desconhecido (ex: loja), NÃO libera acesso.
export function planFromPriceId(
  priceId: string | null | undefined,
  prices: Record<string, string>
): string | null {
  if (!priceId) return null;
  for (const p of PRICE_KEYS) {
    if (priceId === prices[p]) return p;
  }
  return null;
}

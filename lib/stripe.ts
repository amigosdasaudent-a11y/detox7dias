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

// Fim do período atual da assinatura ativa do cliente (ISO) ou null.
// Usado para avisar quantos dias faltam até a próxima cobrança.
export async function getCustomerPeriodEnd(
  customerId: string | null | undefined
): Promise<string | null> {
  if (!customerId) return null;
  try {
    const cfg = await getStripeConfig();
    const stripe = getStripe(cfg.secretKey);
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const sub = subs.data[0];
    if (!sub) return null;
    // Stripe v23: current_period_end fica no item da assinatura
    const end =
      (sub.items?.data?.[0] as { current_period_end?: number } | undefined)
        ?.current_period_end ??
      (sub as unknown as { current_period_end?: number }).current_period_end;
    return end ? new Date(end * 1000).toISOString() : null;
  } catch {
    return null;
  }
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

// Cria preço no Stripe (usa STRIPE_SECRET_KEY do .env.local)
// Uso: node scripts/make-price.mjs <productId> <valorCentavos> <currency> <interval|null> <nickname>
// Ex mensal: node scripts/make-price.mjs prod_X 2990 brl month "Essencial mensal"
// Ex único:   node scripts/make-price.mjs prod_X 9700 brl once "Vitalicio unico"
import { readFileSync } from "node:fs";
import Stripe from "stripe";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const [product, amount, currency, interval, ...nick] = process.argv.slice(2);
if (!product || !amount || !currency || !interval) {
  console.error("Uso: node scripts/make-price.mjs <product> <centavos> <currency> <month|once> [nickname]");
  process.exit(1);
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-09-30.endive",
});

const price = await stripe.prices.create({
  product,
  unit_amount: Number(amount),
  currency,
  ...(interval === "month" ? { recurring: { interval: "month" } } : {}),
  nickname: nick.join(" ") || undefined,
});
console.log(`PRICE_OK ${price.id} | ${price.unit_amount} ${price.currency} | ${price.recurring?.interval || "one_time"}`);

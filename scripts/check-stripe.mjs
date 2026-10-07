// Validação somente-leitura da STRIPE_SECRET_KEY + lista preços existentes
// Uso: $env:STRIPE_SECRET_KEY='sk_...'; node scripts/check-stripe.mjs
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Faltou STRIPE_SECRET_KEY");
  process.exit(1);
}
console.log(`Modo: ${key.startsWith("sk_live_") ? "LIVE" : "TESTE"}`);

const stripe = new Stripe(key, { apiVersion: "2026-09-30.endive" });

const prices = await stripe.prices.list({ limit: 20, expand: ["data.product"] });
console.log(`Preços encontrados: ${prices.data.length}`);
for (const p of prices.data) {
  const prod = typeof p.product === "object" ? p.product : { name: p.product, id: p.product };
  const valor = `${(p.unit_amount ?? 0) / 100} ${p.currency}`.toUpperCase();
  console.log(
    `- ${p.id} | ${prod.name} (${prod.id}) | ${valor} | ${p.type} | recurring=${p.recurring?.interval ?? "-"} | ativo=${p.active}`
  );
}

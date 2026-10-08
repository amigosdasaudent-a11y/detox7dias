// Cria webhook de produção no Stripe (usa STRIPE_SECRET_KEY do .env.local)
// Uso: node scripts/make-webhook.mjs https://SEU-DOMINIO/api/stripe/webhook
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

const url = process.argv[2];
if (!url?.startsWith("https://")) {
  console.error("Uso: node scripts/make-webhook.mjs https://dominio/api/stripe/webhook");
  process.exit(1);
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-09-30.endive",
});

const existing = await stripe.webhookEndpoints.list({ limit: 100 });
const dup = existing.data.find((w) => w.url === url);
if (dup) {
  console.log(`WEBHOOK_EXISTS ${dup.id} status=${dup.status}`);
  process.exit(0);
}

const wh = await stripe.webhookEndpoints.create({
  url,
  enabled_events: [
    "checkout.session.completed",
    "invoice.paid",
    "customer.subscription.deleted",
    "charge.refunded",
    "charge.dispute.created",
  ],
  description: "Detox Body Max producao",
});
console.log(`WEBHOOK_OK ${wh.id}`);
console.log(`WEBHOOK_SECRET=${wh.secret}`);

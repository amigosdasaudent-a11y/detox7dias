// Teste direto do webhook com assinatura válida (sem depender do `stripe listen`)
// Uso: node scripts/test-webhook.mjs [email]
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

const secret = env.STRIPE_WEBHOOK_SECRET;
const live = env.STRIPE_SECRET_KEY;
if (!secret || !live) {
  console.error("Faltam STRIPE_WEBHOOK_SECRET ou STRIPE_SECRET_KEY no .env.local");
  process.exit(1);
}

const email = process.argv[2] || "teste-detox@example.com";
const evtId = `evt_test_${Date.now()}`;
const payload = JSON.stringify({
  id: evtId,
  object: "event",
  type: "checkout.session.completed",
  data: {
    object: {
      id: `cs_test_${Date.now()}`,
      object: "checkout.session",
      customer: null,
      customer_details: { email },
      metadata: { plan: "essencial" },
    },
  },
});

const header = Stripe.webhooks.generateTestHeaderString({
  payload,
  secret,
});

const res = await fetch("http://localhost:3000/api/stripe/webhook", {
  method: "POST",
  headers: { "Content-Type": "application/json", "stripe-signature": header },
  body: payload,
});
console.log(`HTTP ${res.status}: ${await res.text()}`);

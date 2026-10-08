// Monta o modo TESTE do zero: produtos + preços + webhook, e salva tudo em settings.
// Uso: $env:STRIPE_TEST_KEY='sk_test_...'; node scripts/setup-test-mode.mjs https://SEU-DOMINIO/api/stripe/webhook
// A chave NUNCA é gravada em arquivo: vai do env para settings (banco) direto.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

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

const testKey = process.env.STRIPE_TEST_KEY;
const webhookUrl = process.argv[2];
if (!testKey?.startsWith("sk_test_")) {
  console.error("STRIPE_TEST_KEY precisa começar com sk_test_");
  process.exit(1);
}
if (!webhookUrl?.startsWith("https://")) {
  console.error("Informe a URL pública do webhook");
  process.exit(1);
}

const stripe = new Stripe(testKey, { apiVersion: "2026-09-30.endive" });
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function save(key, value) {
  const { error } = await supabase
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw new Error(`settings ${key}: ${error.message}`);
}

// Confere a chave (só leitura)
const check = await stripe.prices.list({ limit: 1 });
console.log(`TEST_KEY OK (preços existentes: ${check.data.length})`);

const plans = [
  { plan: "essencial", name: "Essencial Detox (teste)", amount: 2990 },
  { plan: "completo", name: "Completo Detox (teste)", amount: 1990 },
  { plan: "vitalicio", name: "Vitalício Detox (teste)", amount: 2190 },
];
for (const p of plans) {
  const prod = await stripe.products.create({ name: p.name });
  const price = await stripe.prices.create({
    product: prod.id,
    unit_amount: p.amount,
    currency: "brl",
    recurring: { interval: "month" },
    nickname: `${p.plan} mensal teste`,
  });
  await save(`stripe_test_price_${p.plan}`, price.id);
  console.log(`PRICE ${p.plan}: ${price.id}`);
}

const existing = await stripe.webhookEndpoints.list({ limit: 100 });
let wh = existing.data.find((w) => w.url === webhookUrl);
if (!wh) {
  wh = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: [
      "checkout.session.completed",
      "invoice.paid",
      "customer.subscription.deleted",
      "charge.refunded",
      "charge.dispute.created",
    ],
    description: "Detox Body Max teste",
  });
  console.log(`WEBHOOK criado: ${wh.id}`);
} else {
  console.log(`WEBHOOK já existia: ${wh.id}`);
}
await save("stripe_test_webhook", wh.secret);
await save("stripe_test_secret", testKey);
console.log("SETTINGS salvos. Modo teste pronto.");

// Gira o webhook de TESTE (novo whsec) e salva os 5 valores corretos em settings.
// Uso: $env:STRIPE_TEST_KEY='sk_test_...'; node scripts/fix-test-webhook.mjs https://DOMINIO/api/stripe/webhook price_ess price_comp price_vit
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

const testKey = (process.env.STRIPE_TEST_KEY || "").trim();
const [url, pEss, pComp, pVit] = process.argv.slice(2);
if (!testKey.startsWith("sk_test_") || !url?.startsWith("https://") || !pEss || !pComp || !pVit) {
  console.error("Uso: STRIPE_TEST_KEY=sk_test_... node scripts/fix-test-webhook.mjs <webhookUrl> <priceEss> <priceComp> <priceVit>");
  process.exit(1);
}

const stripe = new Stripe(testKey, { apiVersion: "2026-09-30.endive" });
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function save(key, value) {
  const { error } = await supabase
    .from("settings")
    .upsert({ key, value: value.trim(), updated_at: new Date().toISOString() });
  if (error) throw new Error(`settings ${key}: ${error.message}`);
  console.log(`SAVED ${key}`);
}

// Remove endpoints de teste antigos desta URL e cria um novo (novo whsec)
const existing = await stripe.webhookEndpoints.list({ limit: 100 });
for (const w of existing.data.filter((w) => w.url === url)) {
  await stripe.webhookEndpoints.del(w.id);
  console.log(`deleted ${w.id}`);
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
  description: "Detox Body Max teste",
});
console.log(`WEBHOOK novo: ${wh.id}`);

await save("stripe_test_secret", testKey);
await save("stripe_test_webhook", wh.secret);
await save("stripe_test_price_essencial", pEss);
await save("stripe_test_price_completo", pComp);
await save("stripe_test_price_vitalicio", pVit);
await save("stripe_mode", "test");
console.log("TUDO CERTO no modo teste.");

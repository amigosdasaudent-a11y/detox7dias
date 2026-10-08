// Aplica um SQL qualquer no Postgres (via pooler)
// Uso: $env:DATABASE_URL='...'; node scripts/apply-sql.mjs supabase/migrations/002_collections.sql
import { readFileSync } from "node:fs";
import { Client } from "pg";

const url = process.env.DATABASE_URL;
const file = process.argv[2];
if (!url || !file) {
  console.error("Uso: DATABASE_URL=... node scripts/apply-sql.mjs <arquivo.sql>");
  process.exit(1);
}

const sql = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log(`OK: ${file} aplicado`);
} catch (e) {
  console.error("FALHOU:", e.message);
  process.exit(1);
} finally {
  await client.end();
}

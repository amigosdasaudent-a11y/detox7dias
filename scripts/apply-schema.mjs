// Roda supabase/schema.sql direto no Postgres (precisa de DATABASE_URL)
// Uso: $env:DATABASE_URL="postgresql://postgres:SENHA@db.hlowcolyzkvipmdobskk.supabase.co:5432/postgres"; node scripts/apply-schema.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Faltou DATABASE_URL. Ex: postgresql://postgres:SUA_SENHA@db.hlowcolyzkvipmdobskk.supabase.co:5432/postgres");
  process.exit(1);
}

const sql = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log("OK: schema aplicado");
} catch (e) {
  console.error("FALHOU:", e.message);
  process.exit(1);
} finally {
  await client.end();
}

-- Migration 003: loja (products) com WhatsApp/externo + liberação de acesso
alter table products add column if not exists description text;
alter table products add column if not exists kind text default 'external' check (kind in ('whatsapp','external'));
alter table products add column if not exists target_url text;
alter table products add column if not exists grants_plan text check (grants_plan in ('essencial','completo','vitalicio'));
-- policies existentes (products_read/products_admin) já cobrem as novas colunas

-- =============================================
-- Migration 012: um conteúdo pode pertencer a vários produtos
-- Ex.: os PDFs "Sopas Detox", "Sucos Detox" e "Comida Viva" aparecem
-- tanto no Detox 7 Dias quanto no Detox 15 Dias.
-- Rodar: node scripts/apply-sql.mjs supabase/migrations/012_content_collections.sql
-- =============================================

create table if not exists content_collections (
  content_id uuid not null references contents(id) on delete cascade,
  collection_id uuid not null references collections(id) on delete cascade,
  -- Ordem do conteúdo dentro do produto (empate: sort_order do próprio conteúdo).
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  primary key (content_id, collection_id)
);

create index if not exists content_collections_collection_idx
  on content_collections(collection_id);
create index if not exists content_collections_content_idx
  on content_collections(content_id);

alter table content_collections enable row level security;

-- Leitura liberada (só ids de vínculo; o conteúdo em si continua protegido).
drop policy if exists "content_collections_read" on content_collections;
create policy "content_collections_read" on content_collections
  for select using (true);

-- Escrita só pelo admin (painel usa service role).
drop policy if exists "content_collections_admin" on content_collections;
create policy "content_collections_admin" on content_collections
  for all using (is_admin()) with check (is_admin());

-- Copia o vínculo único que existia em contents.collection_id.
-- A coluna continua existindo como "produto principal" (compatibilidade).
insert into content_collections (content_id, collection_id)
select id, collection_id
from contents
where collection_id is not null
on conflict (content_id, collection_id) do nothing;

-- Migration 002: produtos de conteúdo (collections)
-- Um produto tem capa; clicar abre as aulas (contents) dele.

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_path text,
  min_plan text default 'essencial',
  sort_order int default 0,
  published boolean default true,
  created_at timestamptz default now()
);

alter table contents add column if not exists collection_id uuid references collections(id) on delete set null;
create index if not exists contents_collection_id_idx on contents(collection_id);

alter table collections enable row level security;

drop policy if exists "collections_read" on collections;
create policy "collections_read" on collections for select using (published = true or is_admin());
drop policy if exists "collections_admin" on collections;
create policy "collections_admin" on collections for all using (is_admin());

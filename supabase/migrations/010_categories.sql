-- Migration 010: categorias editaveis no admin (agrupa produtos e aulas)
-- A coluna de texto continua sendo a fonte (collections.category / contents.category);
-- esta tabela define a LISTA e a ORDEM das categorias.

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists categories_name_key on categories (lower(name));

alter table categories enable row level security;
drop policy if exists "categories_read" on categories;
create policy "categories_read" on categories for select using (true);

-- Semeia com as categorias ja usadas em produtos e aulas (nao duplica)
insert into categories (name, sort_order)
select nome, row_number() over (order by nome) - 1
from (
  select distinct trim(category) as nome from collections where category is not null and trim(category) <> ''
  union
  select distinct trim(category) as nome from contents where category is not null and trim(category) <> ''
) t
on conflict do nothing;

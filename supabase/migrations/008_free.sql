-- Migration 008: aula gratuita (amostra pública via /ver/[id])
alter table contents add column if not exists is_free boolean default false;
create index if not exists contents_free_idx on contents(is_free) where published = true;

-- Migration 006: inscritos nas novidades (opt-in WhatsApp)
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  active boolean default true,
  created_at timestamptz default now(),
  unique(user_id)
);
create index if not exists subscribers_active_idx on subscribers(active);
alter table subscribers enable row level security;

drop policy if exists "sub_owner" on subscribers;
create policy "sub_owner" on subscribers
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

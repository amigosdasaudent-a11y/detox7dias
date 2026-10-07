-- =============================================
-- Detox Body Max - Schema Supabase (Fase 1)
-- Rode no SQL Editor do Supabase
-- =============================================

-- Perfis (1 por usuário do Auth)
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer','admin')),
  quiz_completed boolean not null default false,
  created_at timestamptz default now()
);

-- Liberação de acesso vinda da Stripe
create table if not exists entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  email text not null,
  stripe_customer_id text,
  stripe_session_id text unique,
  plan text not null check (plan in ('essencial','completo','vitalicio')),
  status text not null default 'active' check (status in ('active','refunded','canceled')),
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Eventos Stripe já processados (idempotência)
create table if not exists stripe_events (
  id text primary key,
  processed_at timestamptz default now()
);

-- Banners rotativos
create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  link_url text,
  sort_order int default 0,
  active boolean default true,
  starts_at timestamptz,
  ends_at timestamptz
);

-- E-books, áudios, vídeos
create table if not exists contents (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('ebook','audio','video')),
  title text not null,
  description text,
  cover_path text,
  file_path text,
  external_url text,
  category text,
  min_plan text default 'essencial',
  sort_order int default 0,
  published boolean default true,
  created_at timestamptz default now()
);

-- Quiz
create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  sort_order int not null,
  active boolean default true
);
create table if not exists quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references quiz_questions on delete cascade,
  label text not null,
  sort_order int default 0
);
create table if not exists quiz_answers (
  user_id uuid references profiles(id) on delete cascade,
  question_id uuid references quiz_questions on delete cascade,
  option_id uuid references quiz_options,
  answered_at timestamptz default now(),
  primary key (user_id, question_id)
);

-- Favoritos, progresso, blog, loja, IMC
create table if not exists favorites (
  user_id uuid references profiles(id) on delete cascade,
  content_id uuid references contents(id) on delete cascade,
  primary key (user_id, content_id)
);
create table if not exists progress (
  user_id uuid references profiles(id) on delete cascade,
  content_id uuid references contents(id) on delete cascade,
  done boolean default false,
  last_position int default 0,
  primary key (user_id, content_id)
);
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text,
  body_md text,
  cover_path text,
  published boolean default false,
  published_at timestamptz
);
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text,
  image_path text,
  price_label text,
  checkout_url text,
  active boolean default true,
  sort_order int default 0
);
create table if not exists imc_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  weight_kg numeric, height_cm numeric, age int, sex text,
  goal text, restrictions text,
  imc numeric, classification text,
  ai_plan text,
  created_at timestamptz default now()
);

-- =============================================
-- RLS
-- =============================================
alter table profiles enable row level security;
alter table entitlements enable row level security;
alter table stripe_events enable row level security;
alter table banners enable row level security;
alter table contents enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_options enable row level security;
alter table quiz_answers enable row level security;
alter table favorites enable row level security;
alter table progress enable row level security;
alter table posts enable row level security;
alter table products enable row level security;
alter table imc_history enable row level security;

-- Helper: é admin?
create or replace function is_admin() returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

-- Helper: tem acesso ativo?
create or replace function has_active_access() returns boolean as $$
  select exists (
    select 1 from entitlements
    where user_id = auth.uid() and status = 'active'
    and (expires_at is null or expires_at > now())
  );
$$ language sql security definer stable;

-- profiles: dono lê/atualiza o próprio; admin tudo
drop policy if exists "profiles_owner_read" on profiles;
create policy "profiles_owner_read" on profiles for select using (id = auth.uid() or is_admin());
drop policy if exists "profiles_owner_update" on profiles;
create policy "profiles_owner_update" on profiles for update using (id = auth.uid() or is_admin());
drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert with check (id = auth.uid());

-- entitlements: dono lê; escrita só via service_role (webhook)
drop policy if exists "entitlements_owner_read" on entitlements;
create policy "entitlements_owner_read" on entitlements for select using (user_id = auth.uid() or is_admin());

-- stripe_events: só admin lê (webhook usa service_role)
drop policy if exists "stripe_events_admin" on stripe_events;
create policy "stripe_events_admin" on stripe_events for select using (is_admin());

-- banners: leitura se publicado+ativo; admin tudo
drop policy if exists "banners_read" on banners;
create policy "banners_read" on banners for select using (active = true or is_admin());
drop policy if exists "banners_admin_write" on banners;
create policy "banners_admin_write" on banners for all using (is_admin());

-- contents: publicado legível p/ quem tem acesso; admin tudo
drop policy if exists "contents_read" on contents;
create policy "contents_read" on contents for select using (published = true or is_admin());
drop policy if exists "contents_admin_write" on contents;
create policy "contents_admin_write" on contents for all using (is_admin());

-- quiz questions/options: leitura autenticada; escrita admin
drop policy if exists "quiz_q_read" on quiz_questions;
create policy "quiz_q_read" on quiz_questions for select using (active = true or is_admin());
drop policy if exists "quiz_q_admin" on quiz_questions;
create policy "quiz_q_admin" on quiz_questions for all using (is_admin());
drop policy if exists "quiz_o_read" on quiz_options;
create policy "quiz_o_read" on quiz_options for select using (true);
drop policy if exists "quiz_o_admin" on quiz_options;
create policy "quiz_o_admin" on quiz_options for all using (is_admin());

-- quiz_answers: dono
drop policy if exists "quiz_a_owner" on quiz_answers;
create policy "quiz_a_owner" on quiz_answers for all using (user_id = auth.uid() or is_admin());

-- favorites / progress / imc_history: dono
drop policy if exists "fav_owner" on favorites;
create policy "fav_owner" on favorites for all using (user_id = auth.uid() or is_admin());
drop policy if exists "prog_owner" on progress;
create policy "prog_owner" on progress for all using (user_id = auth.uid() or is_admin());
drop policy if exists "imc_owner" on imc_history;
create policy "imc_owner" on imc_history for all using (user_id = auth.uid() or is_admin());

-- posts/products: públicos se published/active
drop policy if exists "posts_read" on posts;
create policy "posts_read" on posts for select using (published = true or is_admin());
drop policy if exists "posts_admin" on posts;
create policy "posts_admin" on posts for all using (is_admin());
drop policy if exists "products_read" on products;
create policy "products_read" on products for select using (active = true or is_admin());
drop policy if exists "products_admin" on products;
create policy "products_admin" on products for all using (is_admin());

-- =============================================
-- Trigger: cria profile automaticamente no signup
-- =============================================
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =============================================
-- Storage privado
-- =============================================
insert into storage.buckets (id, name, public)
values ('content-files','content-files', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('covers','covers', false)
on conflict (id) do nothing;

-- Leitura do storage feita via URL assinada (API /api/signed-url confere entitlement).
-- Nenhuma policy pública de leitura. Admin faz upload via service_role ou policy abaixo:
drop policy if exists "covers_admin" on storage.objects;
create policy "covers_admin" on storage.objects for all
  using (bucket_id in ('covers','content-files') and is_admin())
  with check (bucket_id in ('covers','content-files') and is_admin());

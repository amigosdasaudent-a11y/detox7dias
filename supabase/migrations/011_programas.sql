-- =============================================
-- Migration 011: acompanhamento dos desafios (Detox 7 Dias)
-- Progresso separado por usuário e por programa.
-- Rodar: node scripts/apply-sql.mjs supabase/migrations/011_programas.sql
-- =============================================

-- Liga um produto (collection) a um programa de acompanhamento.
alter table collections add column if not exists program_id text;

-- Produto existente do desafio de 7 dias (não sobrescreve escolha manual).
update collections
set program_id = 'detox-7'
where program_id is null
  and (title ilike '%detox%7%dias%' or title ilike '%7 dias%');

-- Inscrição no programa
create table if not exists program_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  program_id text not null,
  start_date date not null,
  status text not null default 'ativo'
    check (status in ('triagem','ativo','pausado','concluido','interrompido')),
  egg_intolerance boolean not null default false,
  wake_time text,
  sleep_time text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, program_id)
);

-- Triagem de segurança (uma por usuário/programa)
create table if not exists program_screenings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  program_id text not null,
  answers jsonb not null default '{}'::jsonb,
  approved boolean not null default false,
  status text not null default 'bloqueado',
  created_at timestamptz not null default now(),
  unique (user_id, program_id)
);

-- Medidas do início e do fim (fotos ficam em storage privado)
create table if not exists program_measures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  program_id text not null,
  moment text not null check (moment in ('inicio','fim')),
  weight_kg numeric,
  waist_cm numeric,
  height_cm numeric,
  photo_front_path text,
  photo_side_path text,
  imc numeric,
  created_at timestamptz not null default now(),
  unique (user_id, program_id, moment)
);

-- Progresso de cada dia (refeições, contadores, jejum)
create table if not exists program_day_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  program_id text not null,
  day integer not null check (day between 1 and 60),
  meals jsonb not null default '[]'::jsonb,
  counters jsonb not null default '{}'::jsonb,
  fasting_started_at timestamptz,
  fasting_ended_at timestamptz,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, program_id, day)
);

-- Check-in diário
create table if not exists program_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  program_id text not null,
  day integer not null check (day between 1 and 60),
  weight_kg numeric,
  waist_cm numeric,
  water_cups integer,
  sleep integer check (sleep between 1 and 5),
  energy integer check (energy between 1 and 5),
  mood integer check (mood between 1 and 5),
  symptoms text[] not null default '{}',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, program_id, day)
);

-- Registro do botão "Estou me sentindo mal"
create table if not exists program_symptom_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  program_id text not null,
  day integer,
  symptom text not null default 'mal-estar',
  created_at timestamptz not null default now()
);

-- =============================================
-- RLS: cada pessoa só vê o próprio acompanhamento
-- =============================================
alter table program_enrollments enable row level security;
alter table program_screenings enable row level security;
alter table program_measures enable row level security;
alter table program_day_progress enable row level security;
alter table program_checkins enable row level security;
alter table program_symptom_logs enable row level security;

drop policy if exists "program_enrollments_owner" on program_enrollments;
create policy "program_enrollments_owner" on program_enrollments
  for all using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

drop policy if exists "program_screenings_owner" on program_screenings;
create policy "program_screenings_owner" on program_screenings
  for all using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

drop policy if exists "program_measures_owner" on program_measures;
create policy "program_measures_owner" on program_measures
  for all using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

drop policy if exists "program_day_progress_owner" on program_day_progress;
create policy "program_day_progress_owner" on program_day_progress
  for all using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

drop policy if exists "program_checkins_owner" on program_checkins;
create policy "program_checkins_owner" on program_checkins
  for all using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

drop policy if exists "program_symptom_logs_owner" on program_symptom_logs;
create policy "program_symptom_logs_owner" on program_symptom_logs
  for all using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

create index if not exists program_day_progress_user_idx
  on program_day_progress (user_id, program_id);
create index if not exists program_checkins_user_idx
  on program_checkins (user_id, program_id);

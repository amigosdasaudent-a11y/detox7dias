-- Migration 007: provedor de IA usado no cálculo (para limite semanal da paga)
alter table imc_history add column if not exists provider text;

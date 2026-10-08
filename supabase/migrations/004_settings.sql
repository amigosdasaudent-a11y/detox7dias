-- Migration 004: configurações sensíveis do servidor (ex: Stripe teste/live)
-- RLS ativo SEM policies: ninguém lê via API; só service_role (servidor).
create table if not exists settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);
alter table settings enable row level security;
-- Chaves usadas:
--   stripe_mode            -> 'test' | 'live'
--   stripe_test_secret     -> sk_test_...
--   stripe_live_secret     -> sk_live_...
--   stripe_test_webhook    -> whsec_... (modo teste)
--   stripe_live_webhook    -> whsec_... (produção)
--   stripe_test_price_essencial | _completo | _vitalicio  -> price_...
--   stripe_live_price_essencial | _completo | _vitalicio  -> price_...

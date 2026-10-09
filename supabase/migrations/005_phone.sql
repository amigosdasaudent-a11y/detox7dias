-- Migration 005: telefone do cliente (WhatsApp via Evolution)
alter table entitlements add column if not exists phone text;
create index if not exists entitlements_phone_idx on entitlements(phone);

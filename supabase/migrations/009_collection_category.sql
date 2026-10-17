-- Migration 009: categoria do produto (agrupa "Meus produtos" por tema)
alter table collections add column if not exists category text;

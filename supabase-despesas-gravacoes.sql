-- ── Despesas fixas/parceladas + Agenda de Gravações — MarketForge ─────────────
-- Rode este script no SQL Editor do Supabase (Project > SQL Editor > New query).

create extension if not exists pgcrypto;

-- Despesas: tipo (fixa/uma_vez) e parcelamento
alter table despesas add column if not exists tipo text not null default 'uma_vez';
alter table despesas add column if not exists parcelado_em integer not null default 1;
alter table despesas add column if not exists parcela_numero integer not null default 1;

alter table despesas drop constraint if exists despesas_tipo_check;
alter table despesas add constraint despesas_tipo_check check (tipo in ('fixa','uma_vez'));

-- Agenda de gravações
create table if not exists gravacoes (
  id uuid primary key default gen_random_uuid(),
  estabelecimento uuid references clientes(id) on delete cascade,
  data date not null,
  frequencia_acordada text default '1x/semana' check (frequencia_acordada in ('1x/semana','2x/semana','Eventual')),
  status text default 'agendada' check (status in ('agendada','feita','cancelada','nao_foi')),
  responsavel text,
  notas text,
  created_at timestamptz default now()
);

create index if not exists idx_gravacoes_estabelecimento on gravacoes(estabelecimento);
create index if not exists idx_gravacoes_data on gravacoes(data);

-- RLS: mesmo padrão liberado usado pelas demais tabelas do projeto
-- (clientes, tarefas, cobrancas, despesas, colaboradores, prospeccao).
alter table gravacoes enable row level security;

drop policy if exists "Allow all on gravacoes" on gravacoes;
create policy "Allow all on gravacoes" on gravacoes for all using (true) with check (true);

-- ── Relatórios de Tráfego Pago — MarketForge ─────────────────────────────────
-- Rode este script no SQL Editor do Supabase (Project > SQL Editor > New query).

create extension if not exists pgcrypto;

create table if not exists relatorios_trafego (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id),
  cliente_nome text,
  campanha_nome text,
  objetivo text,
  data_inicial date,
  data_final date,
  valor_investido numeric,
  valor_gasto numeric,
  valor_produto numeric,
  qtd_vendas integer,
  desempenho_diario jsonb,
  analise_ia text,
  recomendacoes_ia text,
  resumo_executivo_ia text,
  pdf_url text,
  created_at timestamptz default now()
);

create index if not exists idx_relatorios_trafego_cliente_id on relatorios_trafego(cliente_id);

-- RLS: mesmo padrão liberado usado pelas demais tabelas do projeto
-- (clientes, tarefas, cobrancas, despesas, colaboradores, prospeccao).
alter table relatorios_trafego enable row level security;

drop policy if exists "Allow all on relatorios_trafego" on relatorios_trafego;
create policy "Allow all on relatorios_trafego" on relatorios_trafego for all using (true) with check (true);

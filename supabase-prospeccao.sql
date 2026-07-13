-- ── CRM de Prospecção — MarketForge ──────────────────────────────────────────
-- Rode este script no SQL Editor do Supabase (Project > SQL Editor > New query).

create extension if not exists pgcrypto;

-- Tabela principal de prospecção
create table if not exists prospeccao (
  id uuid primary key default gen_random_uuid(),
  empresa text,
  segmento text,
  bairro text,
  instagram text,
  whatsapp text,
  responsavel text,
  observacoes text,
  status text default 'encontrado',
  prioridade text default 'media',
  temperatura text default 'morno',
  origem text,
  servicos text[],
  valor_estimado numeric,
  motivo_perda text,
  proxima_acao text,
  proxima_acao_data date,
  vendedor text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Histórico de interações/atividades de cada empresa prospectada
create table if not exists prospeccao_historico (
  id uuid primary key default gen_random_uuid(),
  prospeccao_id uuid references prospeccao(id) on delete cascade,
  texto text,
  created_at timestamptz default now()
);

-- Mantém updated_at sempre atualizado em cada UPDATE
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_prospeccao_updated_at on prospeccao;
create trigger trg_prospeccao_updated_at
before update on prospeccao
for each row execute function set_updated_at();

-- Índices de apoio
create index if not exists idx_prospeccao_status on prospeccao(status);
create index if not exists idx_prospeccao_historico_prospeccao_id on prospeccao_historico(prospeccao_id);

-- RLS: liberado para o cliente anon, no mesmo padrão usado pelas demais
-- tabelas do projeto (clientes, tarefas, cobrancas, despesas, colaboradores).
-- Revise isso caso queira restringir o acesso por usuário/perfil no futuro.
alter table prospeccao enable row level security;
alter table prospeccao_historico enable row level security;

drop policy if exists "Allow all on prospeccao" on prospeccao;
create policy "Allow all on prospeccao" on prospeccao for all using (true) with check (true);

drop policy if exists "Allow all on prospeccao_historico" on prospeccao_historico;
create policy "Allow all on prospeccao_historico" on prospeccao_historico for all using (true) with check (true);

-- ── Agenda Recorrente — MarketForge ──────────────────────────────────────────
-- Rode este script no SQL Editor do Supabase (Project > SQL Editor > New query).

create extension if not exists pgcrypto;

create table if not exists agenda_recorrente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  tipo text check (tipo in ('gravacao','reuniao','atendimento')),
  dias_semana integer[],
  horario time,
  local_descricao text,
  responsavel_id uuid references colaboradores(id) on delete set null,
  briefing text,
  ativa boolean default true,
  created_at timestamptz default now()
);

-- data_hora com fuso (timestamptz): o app grava em UTC e exibe no horário local.
-- Com "timestamp" sem fuso, os horários apareceriam deslocados em 3h.
create table if not exists agenda_ocorrencia (
  id uuid primary key default gen_random_uuid(),
  agenda_recorrente_id uuid references agenda_recorrente(id) on delete cascade,
  data_hora timestamptz not null,
  status text default 'pendente' check (status in ('pendente','feita','cancelada')),
  notificacao_enviada boolean default false,
  created_at timestamptz default now(),
  -- evita ocorrências duplicadas quando a janela de 12 semanas é completada
  unique (agenda_recorrente_id, data_hora)
);

create index if not exists idx_agenda_recorrente_cliente on agenda_recorrente(cliente_id);
create index if not exists idx_agenda_ocorrencia_data on agenda_ocorrencia(data_hora);

-- RLS: mesmo padrão liberado usado pelas demais tabelas do projeto
alter table agenda_recorrente enable row level security;
alter table agenda_ocorrencia enable row level security;

drop policy if exists "Allow all on agenda_recorrente" on agenda_recorrente;
create policy "Allow all on agenda_recorrente" on agenda_recorrente for all using (true) with check (true);

drop policy if exists "Allow all on agenda_ocorrencia" on agenda_ocorrencia;
create policy "Allow all on agenda_ocorrencia" on agenda_ocorrencia for all using (true) with check (true);

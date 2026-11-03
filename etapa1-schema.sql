-- ============================================================
-- MarketForge v2 — Schema completo
-- Execute no Supabase SQL Editor (projeto jadhnzbuxgnjibymtcmn)
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- FUNÇÕES AUXILIARES (Security Definer — usadas pelo RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION mf_papel()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT papel FROM public.usuarios WHERE id = auth.uid()),
    'guest'
  );
$$;

CREATE OR REPLACE FUNCTION mf_cliente_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT cliente_id FROM public.usuarios WHERE id = auth.uid();
$$;

-- ============================================================
-- TABELA: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL,
  papel       TEXT NOT NULL CHECK (papel IN ('admin', 'equipe', 'cliente')),
  avatar_url  TEXT,
  cliente_id  UUID,  -- preenchido quando papel = 'cliente'
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  primeiro_acesso BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: clientes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clientes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome            TEXT NOT NULL,
  email           TEXT,
  telefone        TEXT,
  cnpj_cpf        TEXT,
  segmento        TEXT,
  logo_url        TEXT,
  cor_primaria    TEXT DEFAULT '#FF6A00',
  status          TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'prospecto')),
  responsavel_id  UUID REFERENCES public.usuarios(id),
  observacoes     TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agora que clientes existe, adicionar FK em usuarios
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'usuarios_cliente_id_fkey'
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_cliente_id_fkey
      FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- TABELA: planejamentos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.planejamentos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id    UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  titulo        TEXT NOT NULL,
  texto_bruto   TEXT,          -- texto digitado pelo admin antes da IA processar
  conteudo_ia   JSONB,         -- resultado organizado pela IA (OpenAI)
  status        TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'processando', 'ativo', 'arquivado')),
  visivel_cliente BOOLEAN NOT NULL DEFAULT FALSE,
  criado_por    UUID REFERENCES public.usuarios(id),
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: conteudos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conteudos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id    UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  planejamento_id UUID REFERENCES public.planejamentos(id),
  titulo        TEXT NOT NULL,
  descricao     TEXT,
  tipo          TEXT NOT NULL CHECK (tipo IN ('post', 'reels', 'stories', 'feed', 'trafego', 'email', 'outro')),
  status        TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_producao', 'em_revisao', 'aprovado', 'publicado', 'cancelado')),
  data_prevista DATE,
  data_publicacao DATE,
  responsavel_id UUID REFERENCES public.usuarios(id),
  arquivo_url   TEXT,
  observacoes   TEXT,
  visivel_cliente BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: assinaturas (planos recorrentes dos clientes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assinaturas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id      UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  descricao       TEXT NOT NULL,
  valor           NUMERIC(12,2) NOT NULL,
  dia_vencimento  INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
  ativa           BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: cobrancas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cobrancas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assinatura_id   UUID REFERENCES public.assinaturas(id),
  cliente_id      UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  descricao       TEXT NOT NULL,
  valor           NUMERIC(12,2) NOT NULL,
  vencimento      DATE NOT NULL,
  competencia     TEXT NOT NULL,  -- 'YYYY-MM' ex: '2024-01'
  status          TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  data_pagamento  DATE,
  observacoes     TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Evita duplicação de cobrança para mesma assinatura+competência
  UNIQUE (assinatura_id, competencia)
);

-- ============================================================
-- TABELA: despesas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.despesas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  descricao       TEXT NOT NULL,
  categoria       TEXT NOT NULL DEFAULT 'geral',
  tipo            TEXT NOT NULL DEFAULT 'unica' CHECK (tipo IN ('unica', 'fixa', 'parcelada')),
  valor_total     NUMERIC(12,2) NOT NULL,
  total_parcelas  INTEGER DEFAULT 1,
  data_inicio     DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  cliente_id      UUID REFERENCES public.clientes(id),  -- opcional (despesa pode ser da agência)
  criado_por      UUID REFERENCES public.usuarios(id),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: parcelas_despesas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.parcelas_despesas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  despesa_id    UUID NOT NULL REFERENCES public.despesas(id) ON DELETE CASCADE,
  numero        INTEGER NOT NULL,
  valor         NUMERIC(12,2) NOT NULL,
  vencimento    DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  data_pagamento DATE,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: tarefas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tarefas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo          TEXT NOT NULL,
  descricao       TEXT,
  cliente_id      UUID REFERENCES public.clientes(id),
  responsavel_id  UUID REFERENCES public.usuarios(id),
  criado_por      UUID REFERENCES public.usuarios(id),
  status          TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'em_revisao', 'concluida', 'cancelada')),
  prioridade      TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  prazo           TIMESTAMPTZ,
  concluida_em    TIMESTAMPTZ,
  pontos_penalidade INTEGER NOT NULL DEFAULT 0,  -- 1 = atrasou (= R$50)
  penalidade_aplicada BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: pontuacao_equipe
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pontuacao_equipe (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id    UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tarefa_id     UUID NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  pontos        INTEGER NOT NULL DEFAULT 1,  -- 1 ponto = 1 atraso = R$50
  descricao     TEXT,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, tarefa_id)  -- no máximo 1 penalidade por tarefa
);

-- ============================================================
-- TABELA: leads (prospecção)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome            TEXT NOT NULL,
  empresa         TEXT,
  email           TEXT,
  telefone        TEXT,
  segmento        TEXT,
  origem          TEXT,
  valor_estimado  NUMERIC(12,2),
  estagio         TEXT NOT NULL DEFAULT 'novo' CHECK (estagio IN ('novo', 'contato', 'proposta', 'negociacao', 'fechado', 'perdido')),
  responsavel_id  UUID REFERENCES public.usuarios(id),
  observacoes     TEXT,
  ordem           INTEGER DEFAULT 0,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: historico_leads
-- ============================================================
CREATE TABLE IF NOT EXISTS public.historico_leads (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id     UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  usuario_id  UUID REFERENCES public.usuarios(id),
  tipo        TEXT NOT NULL CHECK (tipo IN ('nota', 'ligacao', 'email', 'reuniao', 'mudanca_estagio', 'outro')),
  descricao   TEXT NOT NULL,
  estagio_anterior TEXT,
  estagio_novo     TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: eventos_agenda
-- ============================================================
CREATE TABLE IF NOT EXISTS public.eventos_agenda (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo          TEXT NOT NULL,
  descricao       TEXT,
  tipo            TEXT NOT NULL DEFAULT 'reuniao' CHECK (tipo IN ('reuniao', 'gravacao', 'entrega', 'ligacao', 'outro')),
  cliente_id      UUID REFERENCES public.clientes(id),
  responsavel_id  UUID REFERENCES public.usuarios(id),
  criado_por      UUID REFERENCES public.usuarios(id),
  data_inicio     TIMESTAMPTZ NOT NULL,
  data_fim        TIMESTAMPTZ NOT NULL,
  dia_todo        BOOLEAN NOT NULL DEFAULT FALSE,
  local           TEXT,
  recorrente      BOOLEAN NOT NULL DEFAULT FALSE,
  recorrencia_id  UUID,  -- referência para o grupo de recorrência
  recorrencia_tipo TEXT CHECK (recorrencia_tipo IN ('diario', 'semanal', 'mensal', 'anual')),
  recorrencia_fim  DATE,
  cor             TEXT DEFAULT '#FF6A00',
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: conversas (chat interno)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo          TEXT NOT NULL DEFAULT 'direto' CHECK (tipo IN ('direto', 'grupo', 'cliente')),
  nome          TEXT,  -- para grupos
  cliente_id    UUID REFERENCES public.clientes(id),
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: participantes_conversa
-- ============================================================
CREATE TABLE IF NOT EXISTS public.participantes_conversa (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversa_id   UUID NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  usuario_id    UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversa_id, usuario_id)
);

-- ============================================================
-- TABELA: mensagens
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mensagens (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversa_id   UUID NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  autor_id      UUID NOT NULL REFERENCES public.usuarios(id),
  conteudo      TEXT NOT NULL,
  tipo          TEXT NOT NULL DEFAULT 'texto' CHECK (tipo IN ('texto', 'arquivo', 'imagem')),
  arquivo_url   TEXT,
  lida_por      UUID[] DEFAULT '{}',
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: notificacoes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id    UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  titulo        TEXT NOT NULL,
  mensagem      TEXT NOT NULL,
  tipo          TEXT NOT NULL DEFAULT 'info' CHECK (tipo IN ('info', 'alerta', 'sucesso', 'erro', 'tarefa', 'financeiro')),
  lida          BOOLEAN NOT NULL DEFAULT FALSE,
  url           TEXT,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: push_subscriptions (web push)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id    UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  subscription  JSONB NOT NULL,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, (subscription->>'endpoint'))
);

-- ============================================================
-- TABELA: configuracoes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chave         TEXT NOT NULL UNIQUE,
  valor         JSONB NOT NULL,
  descricao     TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configurações padrão
INSERT INTO public.configuracoes (chave, valor, descricao) VALUES
  ('agencia_nome', '"MarketForge"', 'Nome da agência'),
  ('agencia_logo', '""', 'URL do logo da agência'),
  ('agencia_email', '"contato@marketforge.com.br"', 'E-mail de contato'),
  ('penalidade_valor', '50', 'Valor em reais por ponto de penalidade'),
  ('notificacoes_ativas', 'true', 'Enviar notificações push'),
  ('timezone', '"America/Belem"', 'Fuso horário padrão')
ON CONFLICT (chave) DO NOTHING;

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_papel ON public.usuarios(papel);
CREATE INDEX IF NOT EXISTS idx_usuarios_cliente_id ON public.usuarios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON public.clientes(status);
CREATE INDEX IF NOT EXISTS idx_planejamentos_cliente ON public.planejamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_conteudos_cliente ON public.conteudos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_conteudos_status ON public.conteudos(status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_cliente ON public.cobrancas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_status ON public.cobrancas(status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_vencimento ON public.cobrancas(vencimento);
CREATE INDEX IF NOT EXISTS idx_despesas_status ON public.despesas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel ON public.tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON public.tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_prazo ON public.tarefas(prazo);
CREATE INDEX IF NOT EXISTS idx_leads_estagio ON public.leads(estagio);
CREATE INDEX IF NOT EXISTS idx_eventos_data_inicio ON public.eventos_agenda(data_inicio);
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa ON public.mensagens(conversa_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON public.notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(lida);

-- ============================================================
-- TRIGGERS: atualizado_em automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$;

DO $$ DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'usuarios','clientes','planejamentos','conteudos',
    'assinaturas','cobrancas','despesas','tarefas',
    'leads','eventos_agenda','configuracoes'
  ]
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_updated_%s ON public.%s;
      CREATE TRIGGER trg_updated_%s
      BEFORE UPDATE ON public.%s
      FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();
    ', t, t, t, t);
  END LOOP;
END $$;

-- ============================================================
-- TRIGGER: cobranças atrasadas (atualiza status automaticamente)
-- ============================================================
CREATE OR REPLACE FUNCTION marcar_cobrancas_atrasadas()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.cobrancas
  SET status = 'atrasado'
  WHERE status = 'pendente'
    AND vencimento < CURRENT_DATE;
END;
$$;

-- ============================================================
-- TRIGGER: tarefas atrasadas → aplica penalidade (1x por tarefa)
-- ============================================================
CREATE OR REPLACE FUNCTION aplicar_penalidade_tarefa()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Se a tarefa passou do prazo e não foi concluída e ainda não recebeu penalidade
  IF OLD.penalidade_aplicada = FALSE
     AND NEW.status NOT IN ('concluida', 'cancelada')
     AND NEW.prazo IS NOT NULL
     AND NEW.prazo < NOW() THEN
    -- Registrar penalidade
    INSERT INTO public.pontuacao_equipe (usuario_id, tarefa_id, pontos, descricao)
    VALUES (NEW.responsavel_id, NEW.id, 1, 'Tarefa atrasada: ' || NEW.titulo)
    ON CONFLICT (usuario_id, tarefa_id) DO NOTHING;

    NEW.penalidade_aplicada = TRUE;
    NEW.pontos_penalidade = 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_penalidade_tarefa
BEFORE UPDATE ON public.tarefas
FOR EACH ROW EXECUTE FUNCTION aplicar_penalidade_tarefa();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planejamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conteudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pontuacao_equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participantes_conversa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- ------------------------------------
-- POLÍTICAS: usuarios
-- ------------------------------------
DROP POLICY IF EXISTS "usuarios_select" ON public.usuarios;
CREATE POLICY "usuarios_select" ON public.usuarios
  FOR SELECT USING (
    mf_papel() IN ('admin', 'equipe')
    OR id = auth.uid()
  );

DROP POLICY IF EXISTS "usuarios_insert" ON public.usuarios;
CREATE POLICY "usuarios_insert" ON public.usuarios
  FOR INSERT WITH CHECK (mf_papel() = 'admin');

DROP POLICY IF EXISTS "usuarios_update" ON public.usuarios;
CREATE POLICY "usuarios_update" ON public.usuarios
  FOR UPDATE USING (
    mf_papel() = 'admin' OR id = auth.uid()
  );

DROP POLICY IF EXISTS "usuarios_delete" ON public.usuarios;
CREATE POLICY "usuarios_delete" ON public.usuarios
  FOR DELETE USING (mf_papel() = 'admin');

-- ------------------------------------
-- POLÍTICAS: clientes
-- ------------------------------------
DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
CREATE POLICY "clientes_select" ON public.clientes
  FOR SELECT USING (
    mf_papel() IN ('admin', 'equipe')
    OR id = mf_cliente_id()
  );

DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
CREATE POLICY "clientes_insert" ON public.clientes
  FOR INSERT WITH CHECK (mf_papel() = 'admin');

DROP POLICY IF EXISTS "clientes_update" ON public.clientes;
CREATE POLICY "clientes_update" ON public.clientes
  FOR UPDATE USING (mf_papel() IN ('admin', 'equipe'));

DROP POLICY IF EXISTS "clientes_delete" ON public.clientes;
CREATE POLICY "clientes_delete" ON public.clientes
  FOR DELETE USING (mf_papel() = 'admin');

-- ------------------------------------
-- POLÍTICAS: planejamentos
-- ------------------------------------
DROP POLICY IF EXISTS "planejamentos_select" ON public.planejamentos;
CREATE POLICY "planejamentos_select" ON public.planejamentos
  FOR SELECT USING (
    mf_papel() IN ('admin', 'equipe')
    OR (mf_papel() = 'cliente' AND cliente_id = mf_cliente_id() AND visivel_cliente = TRUE)
  );

DROP POLICY IF EXISTS "planejamentos_insert" ON public.planejamentos;
CREATE POLICY "planejamentos_insert" ON public.planejamentos
  FOR INSERT WITH CHECK (mf_papel() IN ('admin', 'equipe'));

DROP POLICY IF EXISTS "planejamentos_update" ON public.planejamentos;
CREATE POLICY "planejamentos_update" ON public.planejamentos
  FOR UPDATE USING (mf_papel() IN ('admin', 'equipe'));

DROP POLICY IF EXISTS "planejamentos_delete" ON public.planejamentos;
CREATE POLICY "planejamentos_delete" ON public.planejamentos
  FOR DELETE USING (mf_papel() = 'admin');

-- ------------------------------------
-- POLÍTICAS: conteudos
-- ------------------------------------
DROP POLICY IF EXISTS "conteudos_select" ON public.conteudos;
CREATE POLICY "conteudos_select" ON public.conteudos
  FOR SELECT USING (
    mf_papel() IN ('admin', 'equipe')
    OR (mf_papel() = 'cliente' AND cliente_id = mf_cliente_id() AND visivel_cliente = TRUE)
  );

DROP POLICY IF EXISTS "conteudos_write" ON public.conteudos;
CREATE POLICY "conteudos_write" ON public.conteudos
  FOR ALL USING (mf_papel() IN ('admin', 'equipe'));

-- ------------------------------------
-- POLÍTICAS: financeiro (admin e equipe leem, admin escreve)
-- ------------------------------------
DROP POLICY IF EXISTS "assinaturas_select" ON public.assinaturas;
CREATE POLICY "assinaturas_select" ON public.assinaturas
  FOR SELECT USING (mf_papel() IN ('admin', 'equipe'));

DROP POLICY IF EXISTS "assinaturas_write" ON public.assinaturas;
CREATE POLICY "assinaturas_write" ON public.assinaturas
  FOR ALL USING (mf_papel() = 'admin');

DROP POLICY IF EXISTS "cobrancas_select" ON public.cobrancas;
CREATE POLICY "cobrancas_select" ON public.cobrancas
  FOR SELECT USING (
    mf_papel() IN ('admin', 'equipe')
    OR (mf_papel() = 'cliente' AND cliente_id = mf_cliente_id())
  );

DROP POLICY IF EXISTS "cobrancas_write" ON public.cobrancas;
CREATE POLICY "cobrancas_write" ON public.cobrancas
  FOR ALL USING (mf_papel() = 'admin');

DROP POLICY IF EXISTS "despesas_select" ON public.despesas;
CREATE POLICY "despesas_select" ON public.despesas
  FOR SELECT USING (mf_papel() IN ('admin', 'equipe'));

DROP POLICY IF EXISTS "despesas_write" ON public.despesas;
CREATE POLICY "despesas_write" ON public.despesas
  FOR ALL USING (mf_papel() = 'admin');

DROP POLICY IF EXISTS "parcelas_select" ON public.parcelas_despesas;
CREATE POLICY "parcelas_select" ON public.parcelas_despesas
  FOR SELECT USING (mf_papel() IN ('admin', 'equipe'));

DROP POLICY IF EXISTS "parcelas_write" ON public.parcelas_despesas;
CREATE POLICY "parcelas_write" ON public.parcelas_despesas
  FOR ALL USING (mf_papel() = 'admin');

-- ------------------------------------
-- POLÍTICAS: tarefas
-- ------------------------------------
DROP POLICY IF EXISTS "tarefas_select" ON public.tarefas;
CREATE POLICY "tarefas_select" ON public.tarefas
  FOR SELECT USING (mf_papel() IN ('admin', 'equipe'));

DROP POLICY IF EXISTS "tarefas_write" ON public.tarefas;
CREATE POLICY "tarefas_write" ON public.tarefas
  FOR ALL USING (mf_papel() IN ('admin', 'equipe'));

DROP POLICY IF EXISTS "pontuacao_select" ON public.pontuacao_equipe;
CREATE POLICY "pontuacao_select" ON public.pontuacao_equipe
  FOR SELECT USING (mf_papel() IN ('admin', 'equipe'));

DROP POLICY IF EXISTS "pontuacao_write" ON public.pontuacao_equipe;
CREATE POLICY "pontuacao_write" ON public.pontuacao_equipe
  FOR ALL USING (mf_papel() = 'admin');

-- ------------------------------------
-- POLÍTICAS: prospecção (apenas admin/equipe)
-- ------------------------------------
DROP POLICY IF EXISTS "leads_select" ON public.leads;
CREATE POLICY "leads_select" ON public.leads
  FOR SELECT USING (mf_papel() IN ('admin', 'equipe'));

DROP POLICY IF EXISTS "leads_write" ON public.leads;
CREATE POLICY "leads_write" ON public.leads
  FOR ALL USING (mf_papel() IN ('admin', 'equipe'));

DROP POLICY IF EXISTS "historico_leads_select" ON public.historico_leads;
CREATE POLICY "historico_leads_select" ON public.historico_leads
  FOR SELECT USING (mf_papel() IN ('admin', 'equipe'));

DROP POLICY IF EXISTS "historico_leads_write" ON public.historico_leads;
CREATE POLICY "historico_leads_write" ON public.historico_leads
  FOR ALL USING (mf_papel() IN ('admin', 'equipe'));

-- ------------------------------------
-- POLÍTICAS: agenda
-- ------------------------------------
DROP POLICY IF EXISTS "eventos_select" ON public.eventos_agenda;
CREATE POLICY "eventos_select" ON public.eventos_agenda
  FOR SELECT USING (
    mf_papel() IN ('admin', 'equipe')
    OR (mf_papel() = 'cliente' AND cliente_id = mf_cliente_id())
  );

DROP POLICY IF EXISTS "eventos_write" ON public.eventos_agenda;
CREATE POLICY "eventos_write" ON public.eventos_agenda
  FOR ALL USING (mf_papel() IN ('admin', 'equipe'));

-- ------------------------------------
-- POLÍTICAS: mensagens / chat
-- ------------------------------------
DROP POLICY IF EXISTS "conversas_select" ON public.conversas;
CREATE POLICY "conversas_select" ON public.conversas
  FOR SELECT USING (
    id IN (
      SELECT conversa_id FROM public.participantes_conversa
      WHERE usuario_id = auth.uid()
    )
    OR mf_papel() = 'admin'
  );

DROP POLICY IF EXISTS "conversas_write" ON public.conversas;
CREATE POLICY "conversas_write" ON public.conversas
  FOR ALL USING (mf_papel() IN ('admin', 'equipe'));

DROP POLICY IF EXISTS "participantes_select" ON public.participantes_conversa;
CREATE POLICY "participantes_select" ON public.participantes_conversa
  FOR SELECT USING (
    usuario_id = auth.uid() OR mf_papel() = 'admin'
  );

DROP POLICY IF EXISTS "participantes_write" ON public.participantes_conversa;
CREATE POLICY "participantes_write" ON public.participantes_conversa
  FOR ALL USING (mf_papel() IN ('admin', 'equipe'));

DROP POLICY IF EXISTS "mensagens_select" ON public.mensagens;
CREATE POLICY "mensagens_select" ON public.mensagens
  FOR SELECT USING (
    conversa_id IN (
      SELECT conversa_id FROM public.participantes_conversa
      WHERE usuario_id = auth.uid()
    )
    OR mf_papel() = 'admin'
  );

DROP POLICY IF EXISTS "mensagens_insert" ON public.mensagens;
CREATE POLICY "mensagens_insert" ON public.mensagens
  FOR INSERT WITH CHECK (
    autor_id = auth.uid()
    AND conversa_id IN (
      SELECT conversa_id FROM public.participantes_conversa
      WHERE usuario_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "mensagens_update" ON public.mensagens;
CREATE POLICY "mensagens_update" ON public.mensagens
  FOR UPDATE USING (autor_id = auth.uid() OR mf_papel() = 'admin');

-- ------------------------------------
-- POLÍTICAS: notificações
-- ------------------------------------
DROP POLICY IF EXISTS "notificacoes_select" ON public.notificacoes;
CREATE POLICY "notificacoes_select" ON public.notificacoes
  FOR SELECT USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "notificacoes_update" ON public.notificacoes;
CREATE POLICY "notificacoes_update" ON public.notificacoes
  FOR UPDATE USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "notificacoes_insert" ON public.notificacoes;
CREATE POLICY "notificacoes_insert" ON public.notificacoes
  FOR INSERT WITH CHECK (mf_papel() IN ('admin', 'equipe') OR usuario_id = auth.uid());

-- ------------------------------------
-- POLÍTICAS: push_subscriptions
-- ------------------------------------
DROP POLICY IF EXISTS "push_select" ON public.push_subscriptions;
CREATE POLICY "push_select" ON public.push_subscriptions
  FOR SELECT USING (usuario_id = auth.uid() OR mf_papel() = 'admin');

DROP POLICY IF EXISTS "push_write" ON public.push_subscriptions;
CREATE POLICY "push_write" ON public.push_subscriptions
  FOR ALL USING (usuario_id = auth.uid() OR mf_papel() = 'admin');

-- ------------------------------------
-- POLÍTICAS: configurações (apenas admin)
-- ------------------------------------
DROP POLICY IF EXISTS "config_select" ON public.configuracoes;
CREATE POLICY "config_select" ON public.configuracoes
  FOR SELECT USING (mf_papel() IN ('admin', 'equipe'));

DROP POLICY IF EXISTS "config_write" ON public.configuracoes;
CREATE POLICY "config_write" ON public.configuracoes
  FOR ALL USING (mf_papel() = 'admin');

-- ============================================================
-- REALTIME: habilitar para tabelas de chat e notificações
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tarefas;

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================

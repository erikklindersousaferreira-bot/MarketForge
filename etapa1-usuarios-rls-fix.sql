-- ══════════════════════════════════════════════════════════════════════════════
-- MarketForge — Etapa 1: Usuários, Papéis e RLS (versão corrigida)
-- Execute no Supabase SQL Editor (projeto MarketForge)
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. ATUALIZAR TABELA USUARIOS ─────────────────────────────────────────────
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS papel       text NOT NULL DEFAULT 'colaborador'
    CHECK (papel IN ('admin','colaborador','cliente')),
  ADD COLUMN IF NOT EXISTS cliente_id  uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ativo       boolean NOT NULL DEFAULT true;

-- Migra perfil → papel
UPDATE public.usuarios SET papel = 'admin'        WHERE perfil = 'admin'       AND papel = 'colaborador';
UPDATE public.usuarios SET papel = 'colaborador'  WHERE perfil = 'operacional' AND papel = 'colaborador';

-- ── 2. CRIAR TABELA PLANEJAMENTOS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.planejamentos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  titulo      text NOT NULL,
  mes_ref     text,
  status      text NOT NULL DEFAULT 'rascunho'
    CHECK (status IN ('rascunho','publicado')),
  blocos      jsonb NOT NULL DEFAULT '[]',
  pdf_url     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_planejamentos_cliente ON public.planejamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_planejamentos_status  ON public.planejamentos(status);

-- ── 3. CRIAR OU ATUALIZAR TABELA ENTREGAS ────────────────────────────────────
-- Cria se não existir
CREATE TABLE IF NOT EXISTS public.entregas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  titulo          text NOT NULL,
  descricao       text,
  tipo            text,
  data_prevista   date,
  status          text NOT NULL DEFAULT 'planejado'
    CHECK (status IN ('planejado','em_producao','aguardando_cliente','entregue')),
  data_entrega    date,
  link            text,
  interno         boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Adiciona colunas que podem estar faltando (caso a tabela já existisse)
ALTER TABLE public.entregas
  ADD COLUMN IF NOT EXISTS planejamento_id uuid REFERENCES public.planejamentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS descricao       text,
  ADD COLUMN IF NOT EXISTS tipo            text,
  ADD COLUMN IF NOT EXISTS data_prevista   date,
  ADD COLUMN IF NOT EXISTS data_entrega    date,
  ADD COLUMN IF NOT EXISTS link            text,
  ADD COLUMN IF NOT EXISTS interno         boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_entregas_cliente      ON public.entregas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_entregas_planejamento ON public.entregas(planejamento_id);
CREATE INDEX IF NOT EXISTS idx_entregas_data         ON public.entregas(data_prevista);

-- ── 4. RLS — HABILITAR NAS TABELAS ──────────────────────────────────────────
ALTER TABLE public.planejamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios      ENABLE ROW LEVEL SECURITY;

-- ── 5. FUNÇÕES AUXILIARES ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mf_papel()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT papel FROM public.usuarios WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.mf_cliente_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT cliente_id FROM public.usuarios WHERE id = auth.uid();
$$;

-- ── 6. RLS — USUARIOS ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "usuarios_select" ON public.usuarios;
CREATE POLICY "usuarios_select" ON public.usuarios FOR SELECT USING (
  id = auth.uid() OR mf_papel() = 'admin'
);
DROP POLICY IF EXISTS "usuarios_update" ON public.usuarios;
CREATE POLICY "usuarios_update" ON public.usuarios FOR UPDATE USING (
  mf_papel() = 'admin'
);

-- ── 7. RLS — PLANEJAMENTOS ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "planejamentos_equipe_select" ON public.planejamentos;
CREATE POLICY "planejamentos_equipe_select" ON public.planejamentos FOR SELECT USING (
  mf_papel() IN ('admin','colaborador')
);
DROP POLICY IF EXISTS "planejamentos_cliente_select" ON public.planejamentos;
CREATE POLICY "planejamentos_cliente_select" ON public.planejamentos FOR SELECT USING (
  mf_papel() = 'cliente'
  AND cliente_id = mf_cliente_id()
  AND status = 'publicado'
);
DROP POLICY IF EXISTS "planejamentos_equipe_write" ON public.planejamentos;
CREATE POLICY "planejamentos_equipe_write" ON public.planejamentos
  FOR ALL USING (mf_papel() IN ('admin','colaborador'));

-- ── 8. RLS — ENTREGAS ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "entregas_equipe_select" ON public.entregas;
CREATE POLICY "entregas_equipe_select" ON public.entregas FOR SELECT USING (
  mf_papel() IN ('admin','colaborador')
);
DROP POLICY IF EXISTS "entregas_cliente_select" ON public.entregas;
CREATE POLICY "entregas_cliente_select" ON public.entregas FOR SELECT USING (
  mf_papel() = 'cliente'
  AND cliente_id = mf_cliente_id()
  AND interno = false
);
DROP POLICY IF EXISTS "entregas_equipe_write" ON public.entregas;
CREATE POLICY "entregas_equipe_write" ON public.entregas
  FOR ALL USING (mf_papel() IN ('admin','colaborador'));

-- ── 9. RLS — CLIENTES ────────────────────────────────────────────────────────
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clientes_equipe" ON public.clientes;
CREATE POLICY "clientes_equipe" ON public.clientes FOR ALL USING (
  mf_papel() IN ('admin','colaborador')
);

-- ── VERIFICAÇÃO ──────────────────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('usuarios','planejamentos','entregas','clientes')
ORDER BY table_name;

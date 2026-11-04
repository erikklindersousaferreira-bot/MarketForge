-- ============================================================
-- Etapa 5 — Migração da tabela tarefas existente
-- Adiciona colunas faltantes sem perder dados existentes.
-- Execute no Supabase SQL Editor.
-- ============================================================

-- ── Adiciona colunas faltantes na tabela tarefas ─────────────
ALTER TABLE public.tarefas
  ADD COLUMN IF NOT EXISTS prazo              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS concluida_em       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pontos_penalidade  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS penalidade_aplicada BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS atualizado_em      TIMESTAMPTZ NOT NULL DEFAULT now();

-- Copia data_entrega → prazo para registros existentes (se houver dados)
UPDATE public.tarefas SET prazo = data_entrega::TIMESTAMPTZ WHERE prazo IS NULL AND data_entrega IS NOT NULL;

-- ── Trigger de atualização ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_tarefas_updated ON public.tarefas;
CREATE TRIGGER trg_tarefas_updated
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Índices ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tarefas_cliente     ON public.tarefas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel ON public.tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status      ON public.tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_prazo       ON public.tarefas(prazo);

-- ── RLS tarefas ──────────────────────────────────────────────
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tarefas_admin_equipe"   ON public.tarefas;
DROP POLICY IF EXISTS "tarefas_cliente_select" ON public.tarefas;

CREATE POLICY "tarefas_admin_equipe"
  ON public.tarefas FOR ALL TO authenticated
  USING (mf_papel() IN ('admin','equipe'));

CREATE POLICY "tarefas_cliente_select"
  ON public.tarefas FOR SELECT TO authenticated
  USING (mf_papel() = 'cliente' AND cliente_id = mf_cliente_id());

-- ── Tabela pontuacao_equipe ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pontuacao_equipe (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tarefa_id   UUID NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  pontos      INT NOT NULL DEFAULT 1,
  descricao   TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, tarefa_id)
);

CREATE INDEX IF NOT EXISTS idx_pontuacao_usuario ON public.pontuacao_equipe(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pontuacao_tarefa  ON public.pontuacao_equipe(tarefa_id);

ALTER TABLE public.pontuacao_equipe ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pontuacao_admin"         ON public.pontuacao_equipe;
DROP POLICY IF EXISTS "pontuacao_equipe_select" ON public.pontuacao_equipe;

CREATE POLICY "pontuacao_admin"
  ON public.pontuacao_equipe FOR ALL TO authenticated
  USING (mf_papel() = 'admin');

CREATE POLICY "pontuacao_equipe_select"
  ON public.pontuacao_equipe FOR SELECT TO authenticated
  USING (mf_papel() IN ('admin','equipe'));

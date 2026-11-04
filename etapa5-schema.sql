-- ============================================================
-- Etapa 5 — Tarefas + Equipe + Pontuação
-- Execute no Supabase SQL Editor
-- ============================================================

-- ── Tabela tarefas ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tarefas (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo               TEXT NOT NULL,
  descricao            TEXT,
  cliente_id           UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  responsavel_id       UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  criado_por           UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  status               TEXT NOT NULL DEFAULT 'pendente'
                         CHECK (status IN ('pendente','em_andamento','em_revisao','concluida','cancelada')),
  prioridade           TEXT NOT NULL DEFAULT 'media'
                         CHECK (prioridade IN ('baixa','media','alta','urgente')),
  prazo                DATE,
  concluida_em         TIMESTAMPTZ,
  pontos_penalidade    INT NOT NULL DEFAULT 0,
  penalidade_aplicada  BOOLEAN NOT NULL DEFAULT false,
  criado_em            TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Trigger de atualização ───────────────────────────────────
-- (a função set_updated_at já existe da Etapa 4; só cria o trigger)
DROP TRIGGER IF EXISTS trg_tarefas_updated ON public.tarefas;
CREATE TRIGGER trg_tarefas_updated
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Índices ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tarefas_cliente      ON public.tarefas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel  ON public.tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status       ON public.tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_prazo        ON public.tarefas(prazo);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

-- Admin e equipe veem e gerenciam todas
CREATE POLICY "tarefas_admin_equipe"
  ON public.tarefas FOR ALL
  TO authenticated
  USING (mf_papel() IN ('admin','equipe'));

-- Cliente só vê tarefas vinculadas ao próprio cliente
CREATE POLICY "tarefas_cliente_select"
  ON public.tarefas FOR SELECT
  TO authenticated
  USING (
    mf_papel() = 'cliente'
    AND cliente_id = mf_cliente_id()
  );

-- ── Tabela pontuacao_equipe (histórico) ──────────────────────
CREATE TABLE IF NOT EXISTS public.pontuacao_equipe (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tarefa_id    UUID NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  pontos       INT NOT NULL DEFAULT 1,
  descricao    TEXT,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pontuacao_usuario ON public.pontuacao_equipe(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pontuacao_tarefa  ON public.pontuacao_equipe(tarefa_id);

ALTER TABLE public.pontuacao_equipe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pontuacao_admin"
  ON public.pontuacao_equipe FOR ALL
  TO authenticated
  USING (mf_papel() = 'admin');

CREATE POLICY "pontuacao_equipe_select"
  ON public.pontuacao_equipe FOR SELECT
  TO authenticated
  USING (mf_papel() IN ('admin','equipe'));

-- ============================================================
-- Etapa 6 — Agenda: migração / criação da tabela eventos_agenda
-- Seguro para rodar mesmo que a tabela já exista.
-- Execute no Supabase SQL Editor.
-- ============================================================

-- ── Função set_updated_at (cria se não existir) ──────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;

-- ── Tabela eventos_agenda ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.eventos_agenda (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo           TEXT NOT NULL,
  descricao        TEXT,
  tipo             TEXT NOT NULL DEFAULT 'reuniao'
                     CHECK (tipo IN ('reuniao','tarefa','entrega','outro')),
  cliente_id       UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  responsavel_id   UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  criado_por       UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  data_inicio      TIMESTAMPTZ NOT NULL,
  data_fim         TIMESTAMPTZ NOT NULL,
  dia_todo         BOOLEAN NOT NULL DEFAULT false,
  local            TEXT,
  recorrente       BOOLEAN NOT NULL DEFAULT false,
  recorrencia_id   UUID,
  recorrencia_tipo TEXT CHECK (recorrencia_tipo IN ('diario','semanal','mensal','anual')),
  recorrencia_fim  DATE,
  cor              TEXT DEFAULT '#FF6A00',
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Adiciona colunas faltantes caso a tabela já existisse ────
ALTER TABLE public.eventos_agenda
  ADD COLUMN IF NOT EXISTS tipo             TEXT NOT NULL DEFAULT 'reuniao',
  ADD COLUMN IF NOT EXISTS dia_todo         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS local            TEXT,
  ADD COLUMN IF NOT EXISTS recorrente       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recorrencia_id   UUID,
  ADD COLUMN IF NOT EXISTS recorrencia_tipo TEXT,
  ADD COLUMN IF NOT EXISTS recorrencia_fim  DATE,
  ADD COLUMN IF NOT EXISTS cor              TEXT DEFAULT '#FF6A00',
  ADD COLUMN IF NOT EXISTS atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT now();

-- ── Trigger de atualização ───────────────────────────────────
DROP TRIGGER IF EXISTS trg_eventos_agenda_updated ON public.eventos_agenda;
CREATE TRIGGER trg_eventos_agenda_updated
  BEFORE UPDATE ON public.eventos_agenda
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Índices ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_eventos_agenda_data_inicio   ON public.eventos_agenda(data_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_agenda_data_fim      ON public.eventos_agenda(data_fim);
CREATE INDEX IF NOT EXISTS idx_eventos_agenda_cliente       ON public.eventos_agenda(cliente_id);
CREATE INDEX IF NOT EXISTS idx_eventos_agenda_responsavel   ON public.eventos_agenda(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_eventos_agenda_recorrencia   ON public.eventos_agenda(recorrencia_id);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.eventos_agenda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eventos_admin_equipe"   ON public.eventos_agenda;
DROP POLICY IF EXISTS "eventos_cliente_select" ON public.eventos_agenda;

CREATE POLICY "eventos_admin_equipe"
  ON public.eventos_agenda FOR ALL TO authenticated
  USING (mf_papel() IN ('admin','equipe'));

CREATE POLICY "eventos_cliente_select"
  ON public.eventos_agenda FOR SELECT TO authenticated
  USING (mf_papel() = 'cliente' AND cliente_id = mf_cliente_id());

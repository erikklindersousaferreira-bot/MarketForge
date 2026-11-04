-- ============================================================
-- Etapa 4 — Planejamento IA + Conteúdos
-- Execute no Supabase SQL Editor
-- ============================================================

-- ── Tabela planejamentos (novo esquema) ──────────────────────
-- DROP se existir versão antiga
DROP TABLE IF EXISTS public.conteudos CASCADE;
DROP TABLE IF EXISTS public.planejamentos CASCADE;

CREATE TABLE public.planejamentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  mes_referencia  DATE NOT NULL,
  objetivo        TEXT,
  publico_alvo    TEXT,
  tom_voz         TEXT,
  observacoes     TEXT,
  status          TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','arquivado')),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Tabela conteudos ─────────────────────────────────────────
CREATE TABLE public.conteudos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planejamento_id UUID NOT NULL REFERENCES public.planejamentos(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  plataforma      TEXT NOT NULL DEFAULT 'Instagram',
  formato         TEXT NOT NULL DEFAULT 'Feed',
  status          TEXT NOT NULL DEFAULT 'rascunho'
                    CHECK (status IN ('rascunho','aprovado','agendado','publicado','cancelado')),
  data_publicacao DATE,
  legenda         TEXT,
  hashtags        TEXT,
  responsavel     TEXT,
  observacoes     TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Triggers de atualização ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_planejamentos_updated ON public.planejamentos;
CREATE TRIGGER trg_planejamentos_updated
  BEFORE UPDATE ON public.planejamentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_conteudos_updated ON public.conteudos;
CREATE TRIGGER trg_conteudos_updated
  BEFORE UPDATE ON public.conteudos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Índices ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_planejamentos_cliente  ON public.planejamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_planejamentos_mes      ON public.planejamentos(mes_referencia DESC);
CREATE INDEX IF NOT EXISTS idx_conteudos_planejamento ON public.conteudos(planejamento_id);
CREATE INDEX IF NOT EXISTS idx_conteudos_status       ON public.conteudos(status);
CREATE INDEX IF NOT EXISTS idx_conteudos_data         ON public.conteudos(data_publicacao);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.planejamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conteudos     ENABLE ROW LEVEL SECURITY;

-- Planejamentos: admin/equipe veem tudo; cliente vê só o seu
CREATE POLICY "planejamentos_admin_equipe"
  ON public.planejamentos FOR ALL
  TO authenticated
  USING (mf_papel() IN ('admin','equipe'));

CREATE POLICY "planejamentos_cliente_select"
  ON public.planejamentos FOR SELECT
  TO authenticated
  USING (
    mf_papel() = 'cliente'
    AND cliente_id = mf_cliente_id()
  );

-- Conteúdos: seguem planejamento do cliente
CREATE POLICY "conteudos_admin_equipe"
  ON public.conteudos FOR ALL
  TO authenticated
  USING (mf_papel() IN ('admin','equipe'));

CREATE POLICY "conteudos_cliente_select"
  ON public.conteudos FOR SELECT
  TO authenticated
  USING (
    mf_papel() = 'cliente'
    AND EXISTS (
      SELECT 1 FROM public.planejamentos p
      WHERE p.id = planejamento_id
        AND p.cliente_id = mf_cliente_id()
    )
  );

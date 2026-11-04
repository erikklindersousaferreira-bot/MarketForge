-- ============================================================
-- Etapa 7 — Prospecção: tabela leads + interacoes_lead
-- Seguro para rodar mesmo que as tabelas já existam.
-- Execute no Supabase SQL Editor.
-- ============================================================

-- ── Função set_updated_at (cria se não existir) ──────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;

-- ── Tabela leads ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT NOT NULL,
  empresa         TEXT,
  segmento        TEXT,
  telefone        TEXT,
  email           TEXT,
  origem          TEXT DEFAULT 'indicacao'
                    CHECK (origem IN ('indicacao','instagram','facebook','google','site','evento','cold_outreach','outro')),
  estagio         TEXT NOT NULL DEFAULT 'novo'
                    CHECK (estagio IN ('novo','contato','proposta','negociacao','ganho','perdido')),
  valor_estimado  NUMERIC(12,2),
  responsavel_id  UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  criado_por      UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  observacoes     TEXT,
  motivo_perda    TEXT,
  data_fechamento DATE,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adiciona colunas faltantes caso a tabela já exista
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS empresa        TEXT,
  ADD COLUMN IF NOT EXISTS segmento       TEXT,
  ADD COLUMN IF NOT EXISTS telefone       TEXT,
  ADD COLUMN IF NOT EXISTS email          TEXT,
  ADD COLUMN IF NOT EXISTS origem         TEXT DEFAULT 'indicacao',
  ADD COLUMN IF NOT EXISTS valor_estimado NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS criado_por     UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS observacoes    TEXT,
  ADD COLUMN IF NOT EXISTS motivo_perda   TEXT,
  ADD COLUMN IF NOT EXISTS data_fechamento DATE,
  ADD COLUMN IF NOT EXISTS atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_leads_updated ON public.leads;
CREATE TRIGGER trg_leads_updated
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_leads_estagio      ON public.leads(estagio);
CREATE INDEX IF NOT EXISTS idx_leads_responsavel  ON public.leads(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_leads_criado_em    ON public.leads(criado_em);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_admin_equipe" ON public.leads;
CREATE POLICY "leads_admin_equipe"
  ON public.leads FOR ALL TO authenticated
  USING (mf_papel() IN ('admin','equipe'));

-- ── Tabela interacoes_lead ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interacoes_lead (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  usuario_id  UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  tipo        TEXT NOT NULL DEFAULT 'nota'
                CHECK (tipo IN ('nota','ligacao','email','whatsapp','reuniao','proposta')),
  descricao   TEXT NOT NULL,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interacoes_lead    ON public.interacoes_lead(lead_id);
CREATE INDEX IF NOT EXISTS idx_interacoes_usuario ON public.interacoes_lead(usuario_id);
CREATE INDEX IF NOT EXISTS idx_interacoes_criado  ON public.interacoes_lead(criado_em);

ALTER TABLE public.interacoes_lead ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interacoes_admin_equipe" ON public.interacoes_lead;
CREATE POLICY "interacoes_admin_equipe"
  ON public.interacoes_lead FOR ALL TO authenticated
  USING (mf_papel() IN ('admin','equipe'));

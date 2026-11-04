-- ============================================================
-- Etapa 9 — Notificações + Push Subscriptions
-- Execute no Supabase SQL Editor.
-- ============================================================

-- ── Função set_updated_at (cria se não existir) ──────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;

-- ── Tabela notificacoes ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  mensagem    TEXT NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'info'
                CHECK (tipo IN ('info','alerta','sucesso','erro','tarefa','financeiro')),
  lida        BOOLEAN NOT NULL DEFAULT false,
  url         TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garante colunas caso a tabela já existia sem elas
ALTER TABLE public.notificacoes
  ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS titulo     TEXT,
  ADD COLUMN IF NOT EXISTS mensagem   TEXT,
  ADD COLUMN IF NOT EXISTS tipo       TEXT NOT NULL DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS lida       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS url        TEXT,
  ADD COLUMN IF NOT EXISTS criado_em  TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON public.notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida    ON public.notificacoes(lida);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notificacoes_dono" ON public.notificacoes;

CREATE POLICY "notificacoes_dono"
  ON public.notificacoes FOR ALL TO authenticated
  USING (usuario_id = auth.uid());

-- ── Tabela push_subscriptions ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS usuario_id   UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS subscription JSONB,
  ADD COLUMN IF NOT EXISTS criado_em    TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_push_usuario ON public.push_subscriptions(usuario_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_dono" ON public.push_subscriptions;

CREATE POLICY "push_dono"
  ON public.push_subscriptions FOR ALL TO authenticated
  USING (usuario_id = auth.uid());

-- ── View: resumo financeiro mensal ───────────────────────────
CREATE OR REPLACE VIEW public.vw_resumo_financeiro AS
SELECT
  date_trunc('month', vencimento::date)                     AS mes,
  COUNT(*)                                                  AS total_cobrancas,
  SUM(valor)                                                AS receita_total,
  SUM(CASE WHEN status = 'pago'     THEN valor ELSE 0 END)  AS receita_paga,
  SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END)  AS receita_pendente,
  SUM(CASE WHEN status = 'atrasado' THEN valor ELSE 0 END)  AS receita_atrasada
FROM public.cobrancas
GROUP BY 1
ORDER BY 1 DESC;

-- ── View: leads por estágio ───────────────────────────────────
CREATE OR REPLACE VIEW public.vw_leads_funil AS
SELECT
  estagio,
  COUNT(*)                            AS total,
  SUM(COALESCE(valor_estimado, 0))    AS valor_total
FROM public.leads
GROUP BY estagio;

-- ── View: tarefas por status ──────────────────────────────────
CREATE OR REPLACE VIEW public.vw_tarefas_status AS
SELECT
  status,
  COUNT(*) AS total
FROM public.tarefas
GROUP BY status;

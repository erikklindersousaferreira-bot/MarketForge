-- ============================================================
-- Etapa 10 — Configurações do sistema
-- Execute no Supabase SQL Editor.
-- ============================================================

-- ── Tabela configuracoes ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_empresa         TEXT NOT NULL DEFAULT 'MarketForge',
  email_contato        TEXT NOT NULL DEFAULT '',
  telefone             TEXT NOT NULL DEFAULT '',
  cidade               TEXT NOT NULL DEFAULT '',
  site                 TEXT NOT NULL DEFAULT '',
  openai_key           TEXT NOT NULL DEFAULT '',
  vapid_public_key     TEXT NOT NULL DEFAULT '',
  vapid_private_key    TEXT NOT NULL DEFAULT '',
  notif_cobranca_dias  INT  NOT NULL DEFAULT 3,
  notif_tarefa_atraso  BOOLEAN NOT NULL DEFAULT true,
  notif_nova_mensagem  BOOLEAN NOT NULL DEFAULT true,
  atualizado_em        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_configuracoes_updated ON public.configuracoes;
CREATE TRIGGER trg_configuracoes_updated
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Somente admin lê e escreve
DROP POLICY IF EXISTS "config_admin_select" ON public.configuracoes;
CREATE POLICY "config_admin_select"
  ON public.configuracoes FOR SELECT TO authenticated
  USING (mf_papel() = 'admin');

DROP POLICY IF EXISTS "config_admin_insert" ON public.configuracoes;
CREATE POLICY "config_admin_insert"
  ON public.configuracoes FOR INSERT TO authenticated
  WITH CHECK (mf_papel() = 'admin');

DROP POLICY IF EXISTS "config_admin_update" ON public.configuracoes;
CREATE POLICY "config_admin_update"
  ON public.configuracoes FOR UPDATE TO authenticated
  USING (mf_papel() = 'admin');

-- ── Linha inicial (se ainda não existir) ─────────────────────
INSERT INTO public.configuracoes (nome_empresa)
SELECT 'MarketForge'
WHERE NOT EXISTS (SELECT 1 FROM public.configuracoes);

-- ============================================================
-- ETAPA 12 — Planejamento visual com IA + aprovação do cliente
-- MarketForge CRM
-- Não apaga nada. Pode rodar mais de uma vez.
-- Supabase > SQL Editor > cole tudo > Run
-- ============================================================

BEGIN;

-- ── Planejamento: texto base, estrutura gerada pela IA e aprovação ──
ALTER TABLE public.planejamentos ADD COLUMN IF NOT EXISTS texto_base           text;
ALTER TABLE public.planejamentos ADD COLUMN IF NOT EXISTS estrutura            jsonb;
ALTER TABLE public.planejamentos ADD COLUMN IF NOT EXISTS status_aprovacao     text NOT NULL DEFAULT 'rascunho';
ALTER TABLE public.planejamentos ADD COLUMN IF NOT EXISTS comentario_cliente   text;
ALTER TABLE public.planejamentos ADD COLUMN IF NOT EXISTS enviado_em           timestamptz;
ALTER TABLE public.planejamentos ADD COLUMN IF NOT EXISTS aprovado_cliente_em  timestamptz;

ALTER TABLE public.planejamentos DROP CONSTRAINT IF EXISTS planejamentos_status_aprovacao_check;
ALTER TABLE public.planejamentos ADD CONSTRAINT planejamentos_status_aprovacao_check
  CHECK (status_aprovacao IN ('rascunho', 'enviado', 'aprovado', 'ajuste'));

-- ── Conteúdos criados a partir do planejamento da IA ──
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS gerado_ia boolean NOT NULL DEFAULT false;

-- ── Cliente vê as tarefas ligadas ao cliente dele ──
DROP POLICY IF EXISTS "tarefas_cliente_ve_as_suas" ON public.tarefas;
CREATE POLICY "tarefas_cliente_ve_as_suas"
  ON public.tarefas FOR SELECT
  TO authenticated
  USING (mf_papel() = 'cliente' AND cliente_id = mf_cliente_id());

-- ── Cliente vê o próprio cadastro (nome e logo no portal) ──
DROP POLICY IF EXISTS "clientes_cliente_ve_o_seu" ON public.clientes;
CREATE POLICY "clientes_cliente_ve_o_seu"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (mf_papel() = 'cliente' AND id = mf_cliente_id());

-- ── Cliente vê os eventos da agenda dele (gravações) ──
DROP POLICY IF EXISTS "eventos_cliente_ve_os_seus" ON public.eventos_agenda;
CREATE POLICY "eventos_cliente_ve_os_seus"
  ON public.eventos_agenda FOR SELECT
  TO authenticated
  USING (mf_papel() = 'cliente' AND cliente_id = mf_cliente_id());

-- ── Planejamento: cliente só vê depois de enviado ──
DROP POLICY IF EXISTS "planejamentos_cliente_select" ON public.planejamentos;
CREATE POLICY "planejamentos_cliente_select"
  ON public.planejamentos FOR SELECT
  TO authenticated
  USING (
    mf_papel() = 'cliente'
    AND cliente_id = mf_cliente_id()
    AND status_aprovacao IN ('enviado', 'aprovado', 'ajuste')
  );

-- ── Usuários com papel antigo "colaborador" passam a ser "equipe" ──
-- (as regras de acesso do sistema novo só reconhecem admin / equipe / cliente)
DO $$
BEGIN
  UPDATE public.usuarios SET papel = 'equipe' WHERE papel = 'colaborador';
EXCEPTION WHEN check_violation THEN
  RAISE NOTICE 'Papel "equipe" bloqueado por regra antiga; usuários colaborador mantidos.';
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT 'planejamentos' AS tabela,
       COUNT(*) AS linhas,
       string_agg(DISTINCT status_aprovacao, ', ') AS status_aprovacao
FROM public.planejamentos;

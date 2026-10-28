-- ══════════════════════════════════════════════════════════════════════════════
-- MarketForge — Etapa 3: Agenda de Entregas
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. GARANTIR COLUNAS NA TABELA ENTREGAS ───────────────────────────────────
-- (caso alguma etapa anterior não tenha rodado ainda)
ALTER TABLE public.entregas
  ADD COLUMN IF NOT EXISTS descricao       text,
  ADD COLUMN IF NOT EXISTS tipo            text,
  ADD COLUMN IF NOT EXISTS data_prevista   date,
  ADD COLUMN IF NOT EXISTS data_entrega    date,
  ADD COLUMN IF NOT EXISTS link            text,
  ADD COLUMN IF NOT EXISTS interno         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS planejamento_id uuid REFERENCES public.planejamentos(id) ON DELETE SET NULL;

-- ── 2. RECRIAR O CHECK DE STATUS COM OS 4 VALORES CORRETOS ───────────────────
-- Remove constraint antiga (pode ter nome diferente — ignora erro se não existir)
ALTER TABLE public.entregas DROP CONSTRAINT IF EXISTS entregas_status_check;

-- Garante que a coluna existe com default correto
ALTER TABLE public.entregas
  ALTER COLUMN status SET DEFAULT 'planejado',
  ALTER COLUMN status SET NOT NULL;

-- Adiciona o novo CHECK com os 4 status do sistema
ALTER TABLE public.entregas
  ADD CONSTRAINT entregas_status_check
  CHECK (status IN ('planejado','em_producao','aguardando_cliente','entregue'));

-- ── 3. ÍNDICES ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_entregas_cliente      ON public.entregas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_entregas_data         ON public.entregas(data_prevista);
CREATE INDEX IF NOT EXISTS idx_entregas_status       ON public.entregas(status);
CREATE INDEX IF NOT EXISTS idx_entregas_planejamento ON public.entregas(planejamento_id);

-- ── 4. RLS (garante que as políticas estão ativas) ───────────────────────────
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "entregas_equipe_select"  ON public.entregas;
DROP POLICY IF EXISTS "entregas_cliente_select" ON public.entregas;
DROP POLICY IF EXISTS "entregas_equipe_write"   ON public.entregas;

CREATE POLICY "entregas_equipe_select" ON public.entregas
  FOR SELECT USING (mf_papel() IN ('admin','colaborador'));

CREATE POLICY "entregas_cliente_select" ON public.entregas
  FOR SELECT USING (
    mf_papel() = 'cliente'
    AND cliente_id = mf_cliente_id()
    AND interno = false
  );

CREATE POLICY "entregas_equipe_write" ON public.entregas
  FOR ALL USING (mf_papel() IN ('admin','colaborador'));

-- ── VERIFICAÇÃO ───────────────────────────────────────────────────────────────
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'entregas'
ORDER BY ordinal_position;

-- ============================================================
-- Etapa 5 — FIX: RLS para tarefas e pontuacao_equipe
-- As tabelas já existem do schema da Etapa 1.
-- Execute apenas este arquivo no Supabase SQL Editor.
-- ============================================================

-- ── RLS tarefas ──────────────────────────────────────────────
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tarefas_admin_equipe"   ON public.tarefas;
DROP POLICY IF EXISTS "tarefas_cliente_select" ON public.tarefas;

CREATE POLICY "tarefas_admin_equipe"
  ON public.tarefas FOR ALL
  TO authenticated
  USING (mf_papel() IN ('admin','equipe'));

CREATE POLICY "tarefas_cliente_select"
  ON public.tarefas FOR SELECT
  TO authenticated
  USING (
    mf_papel() = 'cliente'
    AND cliente_id = mf_cliente_id()
  );

-- ── RLS pontuacao_equipe ─────────────────────────────────────
ALTER TABLE public.pontuacao_equipe ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pontuacao_admin"          ON public.pontuacao_equipe;
DROP POLICY IF EXISTS "pontuacao_equipe_select"  ON public.pontuacao_equipe;

CREATE POLICY "pontuacao_admin"
  ON public.pontuacao_equipe FOR ALL
  TO authenticated
  USING (mf_papel() = 'admin');

CREATE POLICY "pontuacao_equipe_select"
  ON public.pontuacao_equipe FOR SELECT
  TO authenticated
  USING (mf_papel() IN ('admin','equipe'));

-- ── Trigger de atualização (se não existir) ──────────────────
DROP TRIGGER IF EXISTS trg_tarefas_updated ON public.tarefas;
CREATE TRIGGER trg_tarefas_updated
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

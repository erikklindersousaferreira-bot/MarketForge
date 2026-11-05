-- ============================================================
-- ETAPA 16 — Roteiro completo de cada conteúdo
-- (objetivo, gancho, desenvolvimento, chamada para ação, como gravar)
-- Não apaga nada. Pode rodar mais de uma vez.
-- ============================================================
BEGIN;

ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS roteiro jsonb;

-- Cliente vê os conteúdos dos planejamentos que já recebeu
DROP POLICY IF EXISTS "conteudos_cliente_ve_os_seus" ON public.conteudos;
CREATE POLICY "conteudos_cliente_ve_os_seus"
  ON public.conteudos FOR SELECT
  TO authenticated
  USING (
    mf_papel() = 'cliente'
    AND EXISTS (
      SELECT 1 FROM public.planejamentos p
      WHERE p.id = conteudos.planejamento_id
        AND p.cliente_id = mf_cliente_id()
        AND p.status_aprovacao IN ('enviado', 'aprovado', 'ajuste')
    )
  );

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT 'ok — roteiros ativados' AS resultado;

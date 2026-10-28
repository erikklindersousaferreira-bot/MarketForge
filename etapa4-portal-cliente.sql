-- ══════════════════════════════════════════════════════════════════════════════
-- MarketForge — Etapa 4: Portal do Cliente
-- Execute no Supabase SQL Editor
-- Não cria tabelas novas — apenas garante as políticas RLS corretas
-- para que o papel "cliente" acesse seus próprios dados
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. GARANTIR FUNÇÕES AUXILIARES ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mf_papel()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT papel FROM public.usuarios WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.mf_cliente_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT cliente_id FROM public.usuarios WHERE id = auth.uid();
$$;

-- ── 2. RLS — PLANEJAMENTOS (cliente vê apenas os publicados do seu cliente_id) ──
ALTER TABLE public.planejamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planejamentos_equipe_select"  ON public.planejamentos;
DROP POLICY IF EXISTS "planejamentos_cliente_select" ON public.planejamentos;
DROP POLICY IF EXISTS "planejamentos_equipe_write"   ON public.planejamentos;

CREATE POLICY "planejamentos_equipe_select" ON public.planejamentos
  FOR SELECT USING (mf_papel() IN ('admin','colaborador'));

CREATE POLICY "planejamentos_cliente_select" ON public.planejamentos
  FOR SELECT USING (
    mf_papel() = 'cliente'
    AND cliente_id = mf_cliente_id()
    AND status = 'publicado'
  );

CREATE POLICY "planejamentos_equipe_write" ON public.planejamentos
  FOR ALL USING (mf_papel() IN ('admin','colaborador'));

-- ── 3. RLS — ENTREGAS (cliente vê apenas as não-internas do seu cliente_id) ──
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

-- ── 4. RLS — USUARIOS (cliente vê apenas o próprio registro) ─────────────────
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_select" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON public.usuarios;

CREATE POLICY "usuarios_select" ON public.usuarios
  FOR SELECT USING (id = auth.uid() OR mf_papel() = 'admin');

CREATE POLICY "usuarios_update" ON public.usuarios
  FOR UPDATE USING (mf_papel() = 'admin');

-- ── 5. RLS — CLIENTES (cliente não precisa ver a tabela clientes) ────────────
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_equipe" ON public.clientes;
CREATE POLICY "clientes_equipe" ON public.clientes
  FOR ALL USING (mf_papel() IN ('admin','colaborador'));

-- ── VERIFICAÇÃO ───────────────────────────────────────────────────────────────
-- Deve listar as políticas criadas
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('usuarios','planejamentos','entregas','clientes')
ORDER BY tablename, policyname;

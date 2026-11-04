-- ============================================================
-- Etapa 8 — Portal do Cliente + Chat
-- Execute no Supabase SQL Editor.
-- ============================================================

-- ── Função set_updated_at (cria se não existir) ──────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;

-- ── Tabela conversas ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo         TEXT NOT NULL DEFAULT 'cliente'
                 CHECK (tipo IN ('direto','grupo','cliente')),
  nome         TEXT,
  cliente_id   UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversas
  ADD COLUMN IF NOT EXISTS tipo          TEXT NOT NULL DEFAULT 'cliente',
  ADD COLUMN IF NOT EXISTS nome          TEXT,
  ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_conversas_updated ON public.conversas;
CREATE TRIGGER trg_conversas_updated
  BEFORE UPDATE ON public.conversas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_conversas_cliente ON public.conversas(cliente_id);

ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conversas_admin_equipe"  ON public.conversas;
DROP POLICY IF EXISTS "conversas_cliente_select" ON public.conversas;

CREATE POLICY "conversas_admin_equipe"
  ON public.conversas FOR ALL TO authenticated
  USING (mf_papel() IN ('admin','equipe'));

CREATE POLICY "conversas_cliente_select"
  ON public.conversas FOR SELECT TO authenticated
  USING (mf_papel() = 'cliente' AND cliente_id = mf_cliente_id());

-- ── Tabela participantes_conversa ────────────────────────────
CREATE TABLE IF NOT EXISTS public.participantes_conversa (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id  UUID NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  usuario_id   UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (conversa_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_participantes_conversa ON public.participantes_conversa(conversa_id);
CREATE INDEX IF NOT EXISTS idx_participantes_usuario  ON public.participantes_conversa(usuario_id);

ALTER TABLE public.participantes_conversa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "participantes_admin_equipe"   ON public.participantes_conversa;
DROP POLICY IF EXISTS "participantes_cliente_select" ON public.participantes_conversa;

CREATE POLICY "participantes_admin_equipe"
  ON public.participantes_conversa FOR ALL TO authenticated
  USING (mf_papel() IN ('admin','equipe'));

CREATE POLICY "participantes_cliente_select"
  ON public.participantes_conversa FOR SELECT TO authenticated
  USING (mf_papel() = 'cliente');

-- ── Tabela mensagens ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mensagens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id  UUID NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  autor_id     UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  conteudo     TEXT NOT NULL,
  tipo         TEXT NOT NULL DEFAULT 'texto'
                 CHECK (tipo IN ('texto','arquivo','imagem')),
  arquivo_url  TEXT,
  lida_por     UUID[] NOT NULL DEFAULT '{}',
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_conversa ON public.mensagens(conversa_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_autor    ON public.mensagens(autor_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_criado   ON public.mensagens(criado_em);

ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mensagens_admin_equipe"   ON public.mensagens;
DROP POLICY IF EXISTS "mensagens_cliente_select" ON public.mensagens;
DROP POLICY IF EXISTS "mensagens_cliente_insert" ON public.mensagens;

CREATE POLICY "mensagens_admin_equipe"
  ON public.mensagens FOR ALL TO authenticated
  USING (mf_papel() IN ('admin','equipe'));

CREATE POLICY "mensagens_cliente_select"
  ON public.mensagens FOR SELECT TO authenticated
  USING (
    mf_papel() = 'cliente'
    AND conversa_id IN (
      SELECT id FROM public.conversas WHERE cliente_id = mf_cliente_id()
    )
  );

CREATE POLICY "mensagens_cliente_insert"
  ON public.mensagens FOR INSERT TO authenticated
  WITH CHECK (
    mf_papel() = 'cliente'
    AND conversa_id IN (
      SELECT id FROM public.conversas WHERE cliente_id = mf_cliente_id()
    )
    AND autor_id = auth.uid()
  );

-- ============================================================
-- ETAPA 15 — Tabela de usuários do sistema antigo
-- Solta colunas antigas obrigatórias e regras antigas de "perfil",
-- para o cadastro de novos usuários funcionar. Não apaga nada.
-- ============================================================

BEGIN;

-- Colunas antigas obrigatórias sem valor padrão (menos id/nome/email)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios'
      AND is_nullable = 'NO' AND column_default IS NULL
      AND column_name NOT IN ('id', 'nome', 'email', 'papel')
  LOOP
    EXECUTE format('ALTER TABLE public.usuarios ALTER COLUMN %I DROP NOT NULL', r.column_name);
  END LOOP;
END $$;

-- Regras antigas na coluna "perfil" (ex.: só aceitava 'colaborador')
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.usuarios'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%perfil%'
  LOOP
    EXECUTE format('ALTER TABLE public.usuarios DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- Papel aceita os três do sistema novo
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_papel_check;
DO $$ BEGIN
  ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_papel_check
    CHECK (papel IN ('admin', 'equipe', 'cliente', 'colaborador'));
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Regra de papel não aplicada: %', SQLERRM;
END $$;

-- Valores padrão
ALTER TABLE public.usuarios ALTER COLUMN ativo SET DEFAULT true;
ALTER TABLE public.usuarios ALTER COLUMN primeiro_acesso SET DEFAULT true;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT nome, email, papel, ativo FROM public.usuarios ORDER BY nome;

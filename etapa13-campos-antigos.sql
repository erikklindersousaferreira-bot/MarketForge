-- ============================================================
-- ETAPA 13 — Campos obrigatórios do sistema antigo
-- O banco antigo exige colunas (ex.: despesas.nome, despesas.data_vencimento)
-- que o sistema novo não usa. Isso fazia "Erro ao criar despesa".
-- Aqui: essas colunas deixam de ser obrigatórias e passam a ser
-- preenchidas sozinhas a partir das colunas novas.
-- Não apaga nada. Pode rodar mais de uma vez.
-- ============================================================

BEGIN;

-- 1. Solta o NOT NULL de toda coluna sem valor padrão, exceto as que o sistema novo sempre envia
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name IN ('clientes', 'cobrancas', 'despesas', 'tarefas', 'leads', 'eventos_agenda', 'conteudos', 'planejamentos')
      AND c.is_nullable = 'NO'
      AND c.column_default IS NULL
      AND c.column_name <> 'id'
      AND (c.table_name, c.column_name) NOT IN (
        ('clientes', 'nome'),
        ('cobrancas', 'valor'),
        ('despesas', 'valor'),
        ('tarefas', 'titulo'),
        ('leads', 'nome'),
        ('eventos_agenda', 'titulo'), ('eventos_agenda', 'data_inicio'), ('eventos_agenda', 'data_fim'),
        ('conteudos', 'titulo'), ('conteudos', 'planejamento_id'),
        ('planejamentos', 'cliente_id'), ('planejamentos', 'mes_referencia')
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL', r.table_name, r.column_name);
    RAISE NOTICE 'Coluna % . % agora é opcional', r.table_name, r.column_name;
  END LOOP;
END $$;

-- 2. Mantém as colunas antigas preenchidas a partir das novas
CREATE OR REPLACE FUNCTION public.mf_sync_despesas() RETURNS trigger AS $$
BEGIN
  NEW.nome            := COALESCE(NEW.descricao, NEW.nome);
  NEW.descricao       := COALESCE(NEW.descricao, NEW.nome);
  NEW.data_vencimento := COALESCE(NEW.vencimento, NEW.data_vencimento);
  NEW.vencimento      := COALESCE(NEW.vencimento, NEW.data_vencimento);
  NEW.observacao      := COALESCE(NEW.observacoes, NEW.observacao);
  NEW.recorrente      := COALESCE(NEW.recorrente, NEW.tipo = 'fixa', false);
  NEW.created_at      := COALESCE(NEW.created_at, NEW.criado_em, now());
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.mf_sync_cobrancas() RETURNS trigger AS $$
BEGIN
  NEW.data_vencimento := COALESCE(NEW.vencimento, NEW.data_vencimento);
  NEW.vencimento      := COALESCE(NEW.vencimento, NEW.data_vencimento);
  NEW.observacao      := COALESCE(NEW.observacoes, NEW.observacao);
  NEW.created_at      := COALESCE(NEW.created_at, NEW.criado_em, now());
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.mf_sync_clientes() RETURNS trigger AS $$
BEGIN
  NEW.name       := COALESCE(NEW.nome, NEW.name);
  NEW.whatsapp   := COALESCE(NEW.whatsapp, NEW.telefone);
  NEW.nicho      := COALESCE(NEW.nicho, NEW.segmento);
  NEW.created_at := COALESCE(NEW.created_at, NEW.criado_em, now());
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.mf_sync_tarefas() RETURNS trigger AS $$
BEGIN
  NEW.data_entrega := COALESCE(
    CASE WHEN NEW.prazo IS NOT NULL THEN (NEW.prazo AT TIME ZONE 'America/Belem')::date END,
    NEW.data_entrega);
  NEW.concluido_em := COALESCE(NEW.concluida_em, NEW.concluido_em);
  NEW.created_at   := COALESCE(NEW.created_at, NEW.criado_em, now());
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['despesas', 'cobrancas', 'clientes', 'tarefas'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_sync_antigo ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_sync_antigo BEFORE INSERT OR UPDATE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION public.mf_sync_%s()', t, t, t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT 'ok — despesas, cobranças, clientes e tarefas liberados' AS resultado;

-- ============================================================
-- DIAGNÓSTICO DA ESTRUTURA — MarketForge (só LÊ, não altera nada)
-- Supabase > SQL Editor > cole tudo > Run
-- O resultado é UMA célula. Clique nela, copie (Ctrl+C) e cole no chat.
-- ============================================================
SELECT json_agg(info ORDER BY info->>'tabela') AS diagnostico
FROM (
  SELECT json_build_object(
    'tabela', t.table_name,
    'linhas', (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', t.table_name), false, true, '')))[1]::text,
    'colunas', (SELECT string_agg(c.column_name || ':' || c.data_type, ', ' ORDER BY c.ordinal_position)
                FROM information_schema.columns c
                WHERE c.table_schema = 'public' AND c.table_name = t.table_name),
    'ligacoes', (SELECT string_agg(kcu.column_name || '->' || ccu.table_name, ', ')
                 FROM information_schema.table_constraints tc
                 JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
                 JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
                 WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public' AND tc.table_name = t.table_name),
    'status_usados', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name=t.table_name AND c.column_name='status')
      THEN (xpath('/row/c/text()', query_to_xml(format('select string_agg(distinct status::text, %L) as c from public.%I', ',', t.table_name), false, true, '')))[1]::text
      ELSE NULL END
  ) AS info
  FROM information_schema.tables t
  WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
) x;

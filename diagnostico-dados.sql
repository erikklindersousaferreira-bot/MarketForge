-- ============================================================
-- DIAGNÓSTICO DE DADOS — MarketForge
-- Só LÊ o banco. Não altera nem apaga nada.
-- Supabase > SQL Editor > cole tudo > Run > mande print do resultado
-- ============================================================
SELECT 'clientes (total)' AS item, COUNT(*)::text AS qtd FROM public.clientes
UNION ALL SELECT 'clientes ativos', COUNT(*)::text FROM public.clientes WHERE status = 'ativo'
UNION ALL SELECT 'clientes inativos/prospecto', COUNT(*)::text FROM public.clientes WHERE status <> 'ativo'
UNION ALL SELECT 'lista de clientes', COALESCE(string_agg(nome || ' (' || status || ')', ', '), '-') FROM public.clientes
UNION ALL SELECT 'cobranças (total)', COUNT(*)::text FROM public.cobrancas
UNION ALL SELECT 'cobranças pendentes/atrasadas', COUNT(*)::text || ' = R$ ' || COALESCE(SUM(valor),0)::text FROM public.cobrancas WHERE status IN ('pendente','atrasado')
UNION ALL SELECT 'cobranças SEM cliente válido', COUNT(*)::text FROM public.cobrancas c WHERE c.cliente_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.clientes x WHERE x.id = c.cliente_id)
UNION ALL SELECT 'cobranças de cliente inativo', COUNT(*)::text FROM public.cobrancas c JOIN public.clientes x ON x.id = c.cliente_id WHERE x.status <> 'ativo'
UNION ALL SELECT 'tarefas (total)', COUNT(*)::text FROM public.tarefas
UNION ALL SELECT 'tarefas SEM cliente', COUNT(*)::text FROM public.tarefas t WHERE t.cliente_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.clientes x WHERE x.id = t.cliente_id)
UNION ALL SELECT 'despesas', COUNT(*)::text FROM public.despesas
UNION ALL SELECT 'assinaturas', COUNT(*)::text FROM public.assinaturas
UNION ALL SELECT 'planejamentos', COUNT(*)::text FROM public.planejamentos
UNION ALL SELECT 'conteúdos', COUNT(*)::text FROM public.conteudos
UNION ALL SELECT 'leads', COUNT(*)::text FROM public.leads
UNION ALL SELECT 'eventos da agenda', COUNT(*)::text FROM public.eventos_agenda
UNION ALL SELECT 'conversas', COUNT(*)::text FROM public.conversas
UNION ALL SELECT 'mensagens', COUNT(*)::text FROM public.mensagens
UNION ALL SELECT 'usuários', COUNT(*)::text FROM public.usuarios
UNION ALL SELECT 'conversas tem atualizado_em? (etapa 8)', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversas' AND column_name='atualizado_em') THEN 'sim' ELSE 'NÃO' END;

-- Confere quais etapas do banco já foram aplicadas (só LÊ)
SELECT 'etapa 12 (planejamento visual)' AS etapa,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='planejamentos' AND column_name='estrutura') THEN 'OK' ELSE 'FALTA RODAR' END AS situacao
UNION ALL SELECT 'etapa 13 (campos antigos)',
       CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_despesas_sync_antigo') THEN 'OK' ELSE 'FALTA RODAR' END
UNION ALL SELECT 'etapa 14 (skill e fotos)',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='configuracoes' AND column_name='ia_skill') THEN 'OK' ELSE 'FALTA RODAR' END
UNION ALL SELECT 'etapa 15 (usuários antigos)',
       CASE WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conname='usuarios_papel_check') THEN 'OK' ELSE 'FALTA RODAR' END;

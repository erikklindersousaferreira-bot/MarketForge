-- ============================================================
-- ETAPA 11 — Converter os dados do sistema antigo para o formato novo
-- MarketForge CRM
--
-- • NÃO apaga nenhum dado. Colunas antigas que atrapalhavam foram
--   só RENOMEADAS com o sufixo _antigo (o conteúdo continua lá).
-- • Roda tudo numa transação: se der qualquer erro, nada é alterado.
-- • Pode rodar mais de uma vez sem duplicar nada.
--
-- Supabase > SQL Editor > cole tudo > Run
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- Utilitário: renomeia coluna só se ela existir e o destino não existir
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.renomear(tab text, de text, para text) RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tab AND column_name=de)
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tab AND column_name=para) THEN
    EXECUTE format('ALTER TABLE public.%I RENAME COLUMN %I TO %I', tab, de, para);
  END IF;
END $$ LANGUAGE plpgsql;

-- Utilitário: remove CHECKs antigos de uma tabela (os do sistema antigo
-- não aceitam os valores novos; recriamos os certos no fim)
CREATE OR REPLACE FUNCTION pg_temp.limpar_checks(tab text) RETURNS void AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT conname FROM pg_constraint
           WHERE conrelid = ('public.' || tab)::regclass AND contype = 'c' LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', tab, r.conname);
  END LOOP;
END $$ LANGUAGE plpgsql;

-- Utilitário: remove chaves estrangeiras de uma coluna
CREATE OR REPLACE FUNCTION pg_temp.limpar_fks(tab text, col text) RETURNS void AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT c.conname FROM pg_constraint c
           JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
           WHERE c.conrelid = ('public.' || tab)::regclass AND c.contype = 'f' AND a.attname = col LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', tab, r.conname);
  END LOOP;
END $$ LANGUAGE plpgsql;

-- Mapa colaborador (sistema antigo) -> usuário (sistema novo), por e-mail ou nome
CREATE TEMP TABLE mapa_colab ON COMMIT DROP AS
SELECT c.id AS colaborador_id, c.nome AS colaborador_nome,
       (SELECT u.id FROM public.usuarios u
         WHERE (c.email IS NOT NULL AND lower(trim(u.email)) = lower(trim(c.email)))
            OR lower(trim(u.nome)) = lower(trim(c.nome))
         LIMIT 1) AS usuario_id
FROM public.colaboradores c;


-- ============================================================
-- 1. USUÁRIOS — colunas de data que o sistema novo usa
-- ============================================================
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS criado_em     timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS atualizado_em timestamptz NOT NULL DEFAULT now();


-- ============================================================
-- 2. CLIENTES
-- ============================================================
-- A coluna de texto "responsavel" conflita com o vínculo responsavel_id
SELECT pg_temp.renomear('clientes', 'responsavel', 'responsavel_antigo');

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS nome           text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS email          text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS telefone       text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cnpj_cpf       text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS segmento       text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cor_primaria   text DEFAULT '#FF6A00';
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS responsavel_id uuid;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS status_antigo  text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS criado_em      timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS atualizado_em  timestamptz NOT NULL DEFAULT now();

UPDATE public.clientes SET
  nome          = COALESCE(NULLIF(trim(nome), ''), NULLIF(trim(name), ''), 'Cliente sem nome'),
  telefone      = COALESCE(telefone, whatsapp),
  segmento      = COALESCE(segmento, nicho),
  cor_primaria  = COALESCE(cor_primaria, '#FF6A00'),
  criado_em     = COALESCE(created_at, criado_em),
  status_antigo = COALESCE(status_antigo, status);

SELECT pg_temp.limpar_checks('clientes');
UPDATE public.clientes SET status = CASE
  WHEN status IN ('ativo', 'inativo', 'prospecto') THEN status
  WHEN status IN ('pausado', 'cancelado')           THEN 'inativo'
  ELSE 'ativo' END;

ALTER TABLE public.clientes ALTER COLUMN nome SET NOT NULL;
ALTER TABLE public.clientes ALTER COLUMN status SET DEFAULT 'ativo';
ALTER TABLE public.clientes ADD CONSTRAINT clientes_status_check CHECK (status IN ('ativo', 'inativo', 'prospecto'));

SELECT pg_temp.limpar_fks('clientes', 'responsavel_id');
ALTER TABLE public.clientes ADD CONSTRAINT clientes_responsavel_id_fkey
  FOREIGN KEY (responsavel_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


-- ============================================================
-- 3. COBRANÇAS
-- ============================================================
-- Colunas de texto que conflitam com nomes usados pelo sistema novo
SELECT pg_temp.renomear('cobrancas', 'cliente', 'cliente_antigo');
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='cobrancas' AND column_name='vencimento' AND data_type <> 'date') THEN
    ALTER TABLE public.cobrancas RENAME COLUMN vencimento TO vencimento_antigo;
  END IF;
END $$;

ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS vencimento    date;
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS descricao     text;
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS competencia   text;
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS tipo          text NOT NULL DEFAULT 'mensalidade';
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS recorrente    boolean NOT NULL DEFAULT false;
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS observacoes   text;
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS assinatura_id uuid;
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS criado_em     timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS atualizado_em timestamptz NOT NULL DEFAULT now();

UPDATE public.cobrancas SET
  vencimento  = COALESCE(vencimento, data_vencimento, created_at::date),
  observacoes = COALESCE(observacoes, observacao),
  criado_em   = COALESCE(created_at, criado_em);

UPDATE public.cobrancas SET
  descricao   = COALESCE(NULLIF(trim(descricao), ''), 'Mensalidade ' || to_char(vencimento, 'MM/YYYY')),
  competencia = COALESCE(competencia, to_char(vencimento, 'YYYY-MM'));

SELECT pg_temp.limpar_checks('cobrancas');
UPDATE public.cobrancas SET status = CASE
  WHEN status IN ('pendente', 'pago', 'atrasado', 'cancelado') THEN status
  WHEN status IN ('paga', 'recebido', 'recebida', 'quitado')    THEN 'pago'
  WHEN status IN ('atrasada', 'vencido', 'vencida')             THEN 'atrasado'
  WHEN status IN ('cancelada')                                  THEN 'cancelado'
  ELSE 'pendente' END;

ALTER TABLE public.cobrancas ALTER COLUMN status SET DEFAULT 'pendente';
ALTER TABLE public.cobrancas ADD CONSTRAINT cobrancas_status_check CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado'));
CREATE INDEX IF NOT EXISTS idx_cobrancas_vencimento_data ON public.cobrancas(vencimento);


-- ============================================================
-- 4. DESPESAS + PARCELAS
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='despesas' AND column_name='vencimento' AND data_type <> 'date') THEN
    ALTER TABLE public.despesas RENAME COLUMN vencimento TO vencimento_antigo;
  END IF;
END $$;

ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS vencimento    date;
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS descricao     text;
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS tipo          text NOT NULL DEFAULT 'unica';
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS num_parcelas  integer;
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS observacoes   text;
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS cliente_id    uuid REFERENCES public.clientes(id) ON DELETE SET NULL;
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS criado_em     timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS atualizado_em timestamptz NOT NULL DEFAULT now();

UPDATE public.despesas SET
  vencimento  = COALESCE(vencimento, data_vencimento, created_at::date),
  descricao   = COALESCE(NULLIF(trim(descricao), ''), NULLIF(trim(nome), ''), 'Despesa'),
  observacoes = COALESCE(observacoes, observacao),
  tipo        = CASE WHEN tipo IN ('fixa', 'parcelada') THEN tipo
                     WHEN recorrente IS TRUE THEN 'fixa' ELSE 'unica' END,
  criado_em   = COALESCE(created_at, criado_em);

SELECT pg_temp.limpar_checks('despesas');
UPDATE public.despesas SET status = CASE
  WHEN status IN ('pendente', 'pago', 'atrasado', 'cancelado') THEN status
  WHEN status IN ('paga', 'quitado')                            THEN 'pago'
  WHEN status IN ('atrasada', 'vencida', 'vencido')             THEN 'atrasado'
  ELSE 'pendente' END;
ALTER TABLE public.despesas ALTER COLUMN status SET DEFAULT 'pendente';
ALTER TABLE public.despesas ADD CONSTRAINT despesas_status_check CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado'));
ALTER TABLE public.despesas ADD CONSTRAINT despesas_tipo_check   CHECK (tipo IN ('unica', 'fixa', 'parcelada'));

-- Tabela de parcelas (não existia no banco)
CREATE TABLE IF NOT EXISTS public.parcelas_despesas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  despesa_id      uuid NOT NULL REFERENCES public.despesas(id) ON DELETE CASCADE,
  numero_parcela  integer NOT NULL,
  valor_parcela   numeric(12,2) NOT NULL,
  vencimento      date NOT NULL,
  status          text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  data_pagamento  date,
  criado_em       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.parcelas_despesas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parcelas_select" ON public.parcelas_despesas;
CREATE POLICY "parcelas_select" ON public.parcelas_despesas
  FOR SELECT USING (mf_papel() IN ('admin', 'equipe'));
DROP POLICY IF EXISTS "parcelas_write" ON public.parcelas_despesas;
CREATE POLICY "parcelas_write" ON public.parcelas_despesas
  FOR ALL USING (mf_papel() = 'admin') WITH CHECK (mf_papel() = 'admin');


-- ============================================================
-- 5. TAREFAS
-- ============================================================
SELECT pg_temp.renomear('tarefas', 'cliente', 'cliente_antigo');
SELECT pg_temp.renomear('tarefas', 'responsavel', 'responsavel_antigo');

ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS criado_em          timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS atualizado_em      timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS prazo              timestamptz;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS concluida_em       timestamptz;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS pontos_penalidade  integer NOT NULL DEFAULT 0;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS penalidade_aplicada boolean NOT NULL DEFAULT false;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS status_antigo      text;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS responsavel_antigo text;

UPDATE public.tarefas SET
  criado_em     = COALESCE(created_at, criado_em),
  prazo         = COALESCE(prazo, (data_entrega::timestamp + interval '18 hours') AT TIME ZONE 'America/Belem'),
  concluida_em  = COALESCE(concluida_em, concluido_em),
  status_antigo = COALESCE(status_antigo, status);

SELECT pg_temp.limpar_checks('tarefas');
UPDATE public.tarefas SET status = CASE
  WHEN status IN ('pendente', 'em_andamento', 'em_revisao', 'concluida', 'cancelada') THEN status
  WHEN status IN ('a_fazer', 'afazer', 'todo', 'aberta', 'aberto')                    THEN 'pendente'
  WHEN status IN ('fazendo', 'andamento', 'em_producao', 'producao')                  THEN 'em_andamento'
  WHEN status IN ('revisao', 'aprovacao', 'em_aprovacao')                              THEN 'em_revisao'
  WHEN status IN ('finalizado', 'finalizada', 'concluido', 'feito', 'feita', 'entregue') THEN 'concluida'
  WHEN status IN ('cancelado')                                                          THEN 'cancelada'
  ELSE 'pendente' END;

UPDATE public.tarefas SET prioridade = CASE
  WHEN lower(prioridade) IN ('baixa', 'media', 'alta', 'urgente') THEN lower(prioridade)
  WHEN lower(prioridade) IN ('média', 'normal', 'm')              THEN 'media'
  WHEN lower(prioridade) IN ('urgentíssima', 'critica', 'crítica') THEN 'urgente'
  ELSE 'media' END;

-- Concluídas sem data de conclusão: usa a data de entrega
UPDATE public.tarefas SET concluida_em = COALESCE(concluida_em, prazo, criado_em)
 WHERE status = 'concluida' AND concluida_em IS NULL;

-- Responsável: estava ligado a "colaboradores"; o sistema novo usa "usuarios".
-- Guarda o nome antigo e troca pelo usuário equivalente (mesmo e-mail ou nome).
UPDATE public.tarefas t SET responsavel_antigo = COALESCE(t.responsavel_antigo, m.colaborador_nome)
  FROM mapa_colab m WHERE m.colaborador_id = t.responsavel_id;

SELECT pg_temp.limpar_fks('tarefas', 'responsavel_id');
SELECT pg_temp.limpar_fks('tarefas', 'criado_por');

UPDATE public.tarefas t SET responsavel_id = m.usuario_id
  FROM mapa_colab m WHERE m.colaborador_id = t.responsavel_id;
UPDATE public.tarefas t SET criado_por = m.usuario_id
  FROM mapa_colab m WHERE m.colaborador_id = t.criado_por;
-- Quem não tem usuário equivalente fica sem responsável (nome guardado em responsavel_antigo)
UPDATE public.tarefas SET responsavel_id = NULL
 WHERE responsavel_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = responsavel_id);
UPDATE public.tarefas SET criado_por = NULL
 WHERE criado_por IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = criado_por);

ALTER TABLE public.tarefas ALTER COLUMN status SET DEFAULT 'pendente';
ALTER TABLE public.tarefas ALTER COLUMN prioridade SET DEFAULT 'media';
ALTER TABLE public.tarefas ADD CONSTRAINT tarefas_status_check
  CHECK (status IN ('pendente', 'em_andamento', 'em_revisao', 'concluida', 'cancelada'));
ALTER TABLE public.tarefas ADD CONSTRAINT tarefas_prioridade_check
  CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente'));
ALTER TABLE public.tarefas ADD CONSTRAINT tarefas_responsavel_id_fkey
  FOREIGN KEY (responsavel_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;
ALTER TABLE public.tarefas ADD CONSTRAINT tarefas_criado_por_fkey
  FOREIGN KEY (criado_por) REFERENCES public.usuarios(id) ON DELETE SET NULL;


-- ============================================================
-- 6. PROSPECÇÃO antiga -> LEADS (tela Prospecção nova)
-- ============================================================
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS prospeccao_antiga_id uuid UNIQUE;

INSERT INTO public.leads (nome, empresa, segmento, telefone, origem, estagio, valor_estimado,
                          observacoes, motivo_perda, criado_em, atualizado_em, prospeccao_antiga_id)
SELECT
  COALESCE(NULLIF(trim(p.responsavel), ''), p.empresa, 'Lead'),
  p.empresa,
  p.segmento,
  p.whatsapp,
  CASE
    WHEN lower(trim(p.origem)) IN ('indicacao','instagram','facebook','google','site','evento','cold_outreach','outro') THEN lower(trim(p.origem))
    WHEN p.origem ILIKE '%indica%' THEN 'indicacao'
    WHEN p.origem ILIKE '%insta%'  THEN 'instagram'
    WHEN p.origem ILIKE '%face%'   THEN 'facebook'
    WHEN p.origem ILIKE '%google%' THEN 'google'
    WHEN p.origem ILIKE '%site%'   THEN 'site'
    WHEN p.origem ILIKE '%evento%' THEN 'evento'
    WHEN p.origem ILIKE '%fria%' OR p.origem ILIKE '%cold%' OR p.origem ILIKE '%rua%' OR p.origem ILIKE '%visita%' THEN 'cold_outreach'
    ELSE 'outro' END,
  CASE p.status
    WHEN 'fechado' THEN 'ganho'
    WHEN 'ganho'   THEN 'ganho'
    WHEN 'perdido' THEN 'perdido'
    WHEN 'contato' THEN 'contato'
    WHEN 'contatado' THEN 'contato'
    WHEN 'proposta' THEN 'proposta'
    WHEN 'negociacao' THEN 'negociacao'
    ELSE 'novo' END,
  p.valor_estimado,
  NULLIF(concat_ws(E'\n',
    p.observacoes,
    CASE WHEN p.instagram  IS NOT NULL THEN 'Instagram: ' || p.instagram END,
    CASE WHEN p.bairro     IS NOT NULL THEN 'Bairro: ' || p.bairro END,
    CASE WHEN p.prioridade IS NOT NULL THEN 'Prioridade: ' || p.prioridade END,
    CASE WHEN p.temperatura IS NOT NULL THEN 'Temperatura: ' || p.temperatura END,
    CASE WHEN p.proxima_acao IS NOT NULL THEN 'Próxima ação: ' || p.proxima_acao
         || COALESCE(' (' || to_char(p.proxima_acao_data, 'DD/MM/YYYY') || ')', '') END,
    CASE WHEN p.vendedor IS NOT NULL THEN 'Vendedor: ' || p.vendedor END
  ), ''),
  p.motivo_perda,
  COALESCE(p.created_at, now()),
  COALESCE(p.updated_at, p.created_at, now()),
  p.id
FROM public.prospeccao p
ON CONFLICT (prospeccao_antiga_id) DO NOTHING;

-- Histórico da prospecção antiga -> interações do lead
INSERT INTO public.interacoes_lead (lead_id, tipo, descricao, criado_em)
SELECT l.id, 'nota', h.texto, COALESCE(h.created_at, now())
FROM public.prospeccao_historico h
JOIN public.leads l ON l.prospeccao_antiga_id = h.prospeccao_id
WHERE h.texto IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.interacoes_lead i
                  WHERE i.lead_id = l.id AND i.descricao = h.texto AND i.criado_em = COALESCE(h.created_at, i.criado_em));


-- ============================================================
-- 7. AGENDA antiga (recorrente/ocorrências) -> eventos_agenda
-- ============================================================
ALTER TABLE public.eventos_agenda ADD COLUMN IF NOT EXISTS ocorrencia_antiga_id uuid UNIQUE;

INSERT INTO public.eventos_agenda (titulo, descricao, tipo, cliente_id, data_inicio, data_fim,
                                   dia_todo, local, recorrente, cor, ocorrencia_antiga_id)
SELECT
  initcap(COALESCE(NULLIF(trim(ar.tipo), ''), 'Compromisso')) || COALESCE(' — ' || c.nome, ''),
  ar.briefing,
  CASE WHEN ar.tipo ILIKE '%grav%' OR ar.tipo ILIKE '%video%' OR ar.tipo ILIKE '%vídeo%' OR ar.tipo ILIKE '%foto%' THEN 'gravacao'
       WHEN ar.tipo ILIKE '%reuni%' THEN 'reuniao'
       WHEN ar.tipo ILIKE '%entreg%' THEN 'entrega'
       WHEN ar.tipo ILIKE '%liga%' THEN 'ligacao'
       ELSE 'outro' END,
  ar.cliente_id,
  o.data_hora,
  o.data_hora + interval '1 hour',
  false,
  ar.local_descricao,
  false,
  '#FF6A00',
  o.id
FROM public.agenda_ocorrencia o
JOIN public.agenda_recorrente ar ON ar.id = o.agenda_recorrente_id
LEFT JOIN public.clientes c ON c.id = ar.cliente_id
WHERE COALESCE(o.status, 'pendente') <> 'cancelada'
  AND o.data_hora IS NOT NULL
ON CONFLICT (ocorrencia_antiga_id) DO NOTHING;


-- ============================================================
-- 8. Datas de atualização automáticas
-- ============================================================
CREATE OR REPLACE FUNCTION public.mf_set_atualizado_em() RETURNS trigger AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END $$ LANGUAGE plpgsql;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['clientes', 'cobrancas', 'despesas', 'tarefas', 'usuarios'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_atualizado_em ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_atualizado_em BEFORE UPDATE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION public.mf_set_atualizado_em()', t, t);
  END LOOP;
END $$;

-- Faz a API do Supabase enxergar as colunas/vínculos novos na hora
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================
-- Conferência (aparece como resultado)
-- ============================================================
SELECT 'clientes' AS tabela, COUNT(*) AS linhas, string_agg(DISTINCT status, ', ') AS status FROM public.clientes
UNION ALL SELECT 'cobrancas', COUNT(*), string_agg(DISTINCT status, ', ') FROM public.cobrancas
UNION ALL SELECT 'despesas',  COUNT(*), string_agg(DISTINCT status, ', ') FROM public.despesas
UNION ALL SELECT 'tarefas',   COUNT(*), string_agg(DISTINCT status, ', ') FROM public.tarefas
UNION ALL SELECT 'leads',     COUNT(*), string_agg(DISTINCT estagio, ', ') FROM public.leads
UNION ALL SELECT 'eventos_agenda', COUNT(*), NULL FROM public.eventos_agenda;

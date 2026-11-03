// lib/types.ts — Tipos TypeScript do MarketForge v2

// ============================================================
// Tipos de papel / permissões
// ============================================================
export type Papel = "admin" | "equipe" | "cliente";

export type StatusCor = "verde" | "amarelo" | "vermelho" | "azul" | "roxo" | "cinza";

// ============================================================
// Entidades principais
// ============================================================

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  avatar_url: string | null;
  cliente_id: string | null;
  ativo: boolean;
  primeiro_acesso: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cnpj_cpf: string | null;
  segmento: string | null;
  logo_url: string | null;
  cor_primaria: string;
  status: "ativo" | "inativo" | "prospecto";
  responsavel_id: string | null;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
  // Joins
  responsavel?: Pick<Usuario, "id" | "nome" | "email">;
}

export interface Planejamento {
  id: string;
  cliente_id: string;
  titulo: string;
  texto_bruto: string | null;
  conteudo_ia: Record<string, unknown> | null;
  status: "rascunho" | "processando" | "ativo" | "arquivado";
  visivel_cliente: boolean;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
  // Joins
  cliente?: Pick<Cliente, "id" | "nome">;
  autor?: Pick<Usuario, "id" | "nome">;
}

export interface Conteudo {
  id: string;
  cliente_id: string;
  planejamento_id: string | null;
  titulo: string;
  descricao: string | null;
  tipo: "post" | "reels" | "stories" | "feed" | "trafego" | "email" | "outro";
  status: "pendente" | "em_producao" | "em_revisao" | "aprovado" | "publicado" | "cancelado";
  data_prevista: string | null;
  data_publicacao: string | null;
  responsavel_id: string | null;
  arquivo_url: string | null;
  observacoes: string | null;
  visivel_cliente: boolean;
  criado_em: string;
  atualizado_em: string;
  // Joins
  cliente?: Pick<Cliente, "id" | "nome">;
  responsavel?: Pick<Usuario, "id" | "nome">;
}

export interface Assinatura {
  id: string;
  cliente_id: string;
  descricao: string;
  valor: number;
  dia_vencimento: number;
  ativa: boolean;
  criado_em: string;
  atualizado_em: string;
  // Joins
  cliente?: Pick<Cliente, "id" | "nome">;
}

export interface Cobranca {
  id: string;
  assinatura_id: string | null;
  cliente_id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  competencia: string;
  status: "pendente" | "pago" | "atrasado" | "cancelado";
  data_pagamento: string | null;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
  // Joins
  cliente?: Pick<Cliente, "id" | "nome">;
  assinatura?: Pick<Assinatura, "id" | "descricao">;
}

export interface Despesa {
  id: string;
  descricao: string;
  categoria: string;
  tipo: "unica" | "fixa" | "parcelada";
  valor_total: number;
  total_parcelas: number;
  data_inicio: string;
  status: "pendente" | "pago" | "atrasado" | "cancelado";
  cliente_id: string | null;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
  // Joins
  cliente?: Pick<Cliente, "id" | "nome"> | null;
  parcelas?: ParcelaDespesa[];
}

export interface ParcelaDespesa {
  id: string;
  despesa_id: string;
  numero: number;
  valor: number;
  vencimento: string;
  status: "pendente" | "pago" | "atrasado" | "cancelado";
  data_pagamento: string | null;
  criado_em: string;
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  cliente_id: string | null;
  responsavel_id: string | null;
  criado_por: string | null;
  status: "pendente" | "em_andamento" | "em_revisao" | "concluida" | "cancelada";
  prioridade: "baixa" | "media" | "alta" | "urgente";
  prazo: string | null;
  concluida_em: string | null;
  pontos_penalidade: number;
  penalidade_aplicada: boolean;
  criado_em: string;
  atualizado_em: string;
  // Joins
  cliente?: Pick<Cliente, "id" | "nome"> | null;
  responsavel?: Pick<Usuario, "id" | "nome"> | null;
}

export interface PontuacaoEquipe {
  id: string;
  usuario_id: string;
  tarefa_id: string;
  pontos: number;
  descricao: string | null;
  criado_em: string;
  // Joins
  usuario?: Pick<Usuario, "id" | "nome">;
  tarefa?: Pick<Tarefa, "id" | "titulo">;
}

export interface Lead {
  id: string;
  nome: string;
  empresa: string | null;
  email: string | null;
  telefone: string | null;
  segmento: string | null;
  origem: string | null;
  valor_estimado: number | null;
  estagio: "novo" | "contato" | "proposta" | "negociacao" | "fechado" | "perdido";
  responsavel_id: string | null;
  observacoes: string | null;
  ordem: number;
  criado_em: string;
  atualizado_em: string;
  // Joins
  responsavel?: Pick<Usuario, "id" | "nome"> | null;
}

export interface HistoricoLead {
  id: string;
  lead_id: string;
  usuario_id: string | null;
  tipo: "nota" | "ligacao" | "email" | "reuniao" | "mudanca_estagio" | "outro";
  descricao: string;
  estagio_anterior: string | null;
  estagio_novo: string | null;
  criado_em: string;
  // Joins
  usuario?: Pick<Usuario, "id" | "nome"> | null;
}

export interface EventoAgenda {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: "reuniao" | "gravacao" | "entrega" | "ligacao" | "outro";
  cliente_id: string | null;
  responsavel_id: string | null;
  criado_por: string | null;
  data_inicio: string;
  data_fim: string;
  dia_todo: boolean;
  local: string | null;
  recorrente: boolean;
  recorrencia_id: string | null;
  recorrencia_tipo: "diario" | "semanal" | "mensal" | "anual" | null;
  recorrencia_fim: string | null;
  cor: string;
  criado_em: string;
  atualizado_em: string;
  // Joins
  cliente?: Pick<Cliente, "id" | "nome"> | null;
  responsavel?: Pick<Usuario, "id" | "nome"> | null;
}

export interface Conversa {
  id: string;
  tipo: "direto" | "grupo" | "cliente";
  nome: string | null;
  cliente_id: string | null;
  criado_em: string;
  // Joins
  participantes?: ParticipanteConversa[];
  ultima_mensagem?: Mensagem | null;
  cliente?: Pick<Cliente, "id" | "nome"> | null;
}

export interface ParticipanteConversa {
  id: string;
  conversa_id: string;
  usuario_id: string;
  criado_em: string;
  // Joins
  usuario?: Pick<Usuario, "id" | "nome" | "avatar_url">;
}

export interface Mensagem {
  id: string;
  conversa_id: string;
  autor_id: string;
  conteudo: string;
  tipo: "texto" | "arquivo" | "imagem";
  arquivo_url: string | null;
  lida_por: string[];
  criado_em: string;
  // Joins
  autor?: Pick<Usuario, "id" | "nome" | "avatar_url">;
}

export interface Notificacao {
  id: string;
  usuario_id: string;
  titulo: string;
  mensagem: string;
  tipo: "info" | "alerta" | "sucesso" | "erro" | "tarefa" | "financeiro";
  lida: boolean;
  url: string | null;
  criado_em: string;
}

export interface Configuracao {
  id: string;
  chave: string;
  valor: unknown;
  descricao: string | null;
  atualizado_em: string;
}

// ============================================================
// Tipos auxiliares de UI
// ============================================================

export interface SelectOption {
  value: string;
  label: string;
}

export interface PaginacaoParams {
  pagina: number;
  porPagina: number;
}

export interface FiltroBase {
  busca?: string;
  status?: string;
  clienteId?: string;
  responsavelId?: string;
}

// ============================================================
// Database type (Supabase)
// ============================================================
export type Database = {
  public: {
    Tables: {
      usuarios: { Row: Usuario; Insert: Omit<Usuario, "criado_em" | "atualizado_em">; Update: Partial<Omit<Usuario, "id">>; };
      clientes: { Row: Cliente; Insert: Omit<Cliente, "id" | "criado_em" | "atualizado_em">; Update: Partial<Omit<Cliente, "id">>; };
      planejamentos: { Row: Planejamento; Insert: Omit<Planejamento, "id" | "criado_em" | "atualizado_em">; Update: Partial<Omit<Planejamento, "id">>; };
      conteudos: { Row: Conteudo; Insert: Omit<Conteudo, "id" | "criado_em" | "atualizado_em">; Update: Partial<Omit<Conteudo, "id">>; };
      assinaturas: { Row: Assinatura; Insert: Omit<Assinatura, "id" | "criado_em" | "atualizado_em">; Update: Partial<Omit<Assinatura, "id">>; };
      cobrancas: { Row: Cobranca; Insert: Omit<Cobranca, "id" | "criado_em" | "atualizado_em">; Update: Partial<Omit<Cobranca, "id">>; };
      despesas: { Row: Despesa; Insert: Omit<Despesa, "id" | "criado_em" | "atualizado_em">; Update: Partial<Omit<Despesa, "id">>; };
      parcelas_despesas: { Row: ParcelaDespesa; Insert: Omit<ParcelaDespesa, "id" | "criado_em">; Update: Partial<Omit<ParcelaDespesa, "id">>; };
      tarefas: { Row: Tarefa; Insert: Omit<Tarefa, "id" | "criado_em" | "atualizado_em">; Update: Partial<Omit<Tarefa, "id">>; };
      pontuacao_equipe: { Row: PontuacaoEquipe; Insert: Omit<PontuacaoEquipe, "id" | "criado_em">; Update: Partial<Omit<PontuacaoEquipe, "id">>; };
      leads: { Row: Lead; Insert: Omit<Lead, "id" | "criado_em" | "atualizado_em">; Update: Partial<Omit<Lead, "id">>; };
      historico_leads: { Row: HistoricoLead; Insert: Omit<HistoricoLead, "id" | "criado_em">; Update: Partial<Omit<HistoricoLead, "id">>; };
      eventos_agenda: { Row: EventoAgenda; Insert: Omit<EventoAgenda, "id" | "criado_em" | "atualizado_em">; Update: Partial<Omit<EventoAgenda, "id">>; };
      conversas: { Row: Conversa; Insert: Omit<Conversa, "id" | "criado_em">; Update: Partial<Omit<Conversa, "id">>; };
      participantes_conversa: { Row: ParticipanteConversa; Insert: Omit<ParticipanteConversa, "id" | "criado_em">; Update: Partial<Omit<ParticipanteConversa, "id">>; };
      mensagens: { Row: Mensagem; Insert: Omit<Mensagem, "id" | "criado_em">; Update: Partial<Omit<Mensagem, "id">>; };
      notificacoes: { Row: Notificacao; Insert: Omit<Notificacao, "id" | "criado_em">; Update: Partial<Omit<Notificacao, "id">>; };
      configuracoes: { Row: Configuracao; Insert: Omit<Configuracao, "id" | "atualizado_em">; Update: Partial<Omit<Configuracao, "id">>; };
      push_subscriptions: { Row: { id: string; usuario_id: string | null; subscription: unknown; criado_em: string; }; Insert: { usuario_id?: string | null; subscription: unknown; }; Update: never; };
    };
    Functions: {
      mf_papel: { Args: Record<string, never>; Returns: string; };
      mf_cliente_id: { Args: Record<string, never>; Returns: string; };
    };
  };
};

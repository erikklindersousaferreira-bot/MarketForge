// lib/planejamento-tipos.ts — Estrutura do planejamento visual gerado pela IA

export type ItemSimples = { titulo: string; descricao?: string };

export type EstruturaPlanejamento = {
  /** Linha abaixo do nome do cliente na capa. Ex.: "Programações · Restaurante · Delivery" */
  subtitulo?: string;
  /** Frase curta de abertura */
  introducao?: string;

  /** 1. Objetivos (A, B, C...) */
  objetivos?: ItemSimples[];

  /** 2. Rotina fixa (ex.: stories diários) */
  rotina?: {
    titulo: string;            // "Stories diários"
    subtitulo?: string;        // "Trabalhados todos os dias"
    frequencia?: string;       // "Todos os dias"
    itens: ItemSimples[];
    observacao?: string;
    destaque?: { titulo: string; texto: string; tags?: string[] };
  };

  /** 3. Frentes de conteúdo (ex.: programações noturnas) */
  frentes?: {
    titulo: string;
    subtitulo?: string;
    itens: string[];
    aviso?: string;            // ex.: "Os dias ainda serão confirmados"
    como_funciona?: ItemSimples[];
    objetivo?: string;
  };

  /** 4. Cronograma (datas em destaque) */
  cronograma?: {
    titulo?: string;
    subtitulo?: string;
    itens: { quando: string; titulo: string; descricao?: string; destaque?: boolean }[];
  };

  /** 5. Ações / conteúdos especiais com data */
  acoes?: {
    titulo?: string;
    subtitulo?: string;
    itens: { data: string; tipo?: string; titulo: string; objetivo?: string; status?: "programado" | "pendente" }[];
  };

  /** 6. Próxima etapa / projeto maior */
  proxima_etapa?: {
    titulo: string;
    subtitulo?: string;
    descricao?: string;
    itens?: string[];
    objetivo?: string;
    status?: string;
  };

  /** 7. Resumo */
  resumo?: {
    cards?: { rotulo: string; titulo: string; descricao?: string; destaque?: boolean }[];
    ja_programado?: string[];
    depende_cliente?: string[];
    frase_final?: string;
    subfrase?: string;
  };

  /** Posts/vídeos com data — viram itens em Conteúdos ao enviar */
  conteudos?: {
    titulo: string;
    data?: string | null;      // YYYY-MM-DD
    plataforma?: string;
    formato?: string;
    legenda?: string;
  }[];
};

export type StatusAprovacao = "rascunho" | "enviado" | "aprovado" | "ajuste";

export const STATUS_APROVACAO: Record<StatusAprovacao, { label: string; cls: string }> = {
  rascunho: { label: "Rascunho",              cls: "mf-badge mf-badge-cinza" },
  enviado:  { label: "Aguardando o cliente",  cls: "mf-badge mf-badge-amarelo" },
  aprovado: { label: "Aprovado pelo cliente", cls: "mf-badge mf-badge-verde" },
  ajuste:   { label: "Cliente pediu ajuste",  cls: "mf-badge mf-badge-vermelho" },
};

export function mesPorExtenso(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.slice(0, 10) + "T12:00");
  const txt = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

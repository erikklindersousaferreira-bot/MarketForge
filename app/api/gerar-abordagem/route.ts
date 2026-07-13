import type { NextRequest } from "next/server";

type Empresa = {
  empresa?: string;
  segmento?: string;
  bairro?: string;
  instagram?: string;
  servicos?: string[];
  observacoes?: string;
  temperatura?: string;
  valor_estimado?: number | string;
};

const descreverEmpresa = (e: Empresa) => {
  const linhas = [
    `Nome da empresa: ${e.empresa || "não informado"}`,
    `Segmento: ${e.segmento || "não informado"}`,
    `Bairro/localização: ${e.bairro || "não informado"}`,
    `Instagram: ${e.instagram || "não informado"}`,
    `Serviços de interesse da agência: ${e.servicos?.length ? e.servicos.join(", ") : "não definidos ainda"}`,
    `Temperatura do lead: ${e.temperatura || "não informado"}`,
    `Observações internas: ${e.observacoes || "nenhuma"}`,
  ];
  if (e.valor_estimado) linhas.push(`Valor mensal estimado do contrato: R$ ${e.valor_estimado}`);
  return linhas.join("\n");
};

const SYSTEM_BASE = "Você é um especialista em prospecção comercial para uma agência de marketing digital brasileira chamada MarketForge. Escreva sempre em português do Brasil, em tom natural, direto e persuasivo, sem soar robótico ou genérico. Nunca invente informações que não foram fornecidas — se faltar dado, seja genérico nesse ponto em vez de inventar.";

const PROMPTS: Record<string, (e: Empresa) => { system: string; user: string }> = {
  whatsapp: (e) => ({
    system: `${SYSTEM_BASE} Sua tarefa é escrever uma mensagem de primeiro contato via WhatsApp.`,
    user: `Escreva uma mensagem curta de primeiro contato via WhatsApp para a empresa abaixo, se apresentando como MarketForge e abrindo espaço para uma conversa sobre marketing digital. Máximo de 60 palavras, tom amigável e não invasivo, sem parecer spam.\n\n${descreverEmpresa(e)}`,
  }),
  ligacao: (e) => ({
    system: `${SYSTEM_BASE} Sua tarefa é escrever um roteiro de ligação de prospecção (cold call).`,
    user: `Escreva um roteiro de ligação para prospecção comercial da empresa abaixo. Estruture em: 1) Abertura (10-15s), 2) Perguntas de descoberta, 3) Proposta de valor rápida, 4) Tratamento de possíveis objeções comuns, 5) Fechamento pedindo uma reunião ou visita.\n\n${descreverEmpresa(e)}`,
  }),
  argumentos: (e) => ({
    system: `${SYSTEM_BASE} Sua tarefa é listar argumentos de venda.`,
    user: `Liste de 5 a 8 argumentos de venda específicos para convencer esta empresa a contratar os serviços de marketing digital da MarketForge, considerando o segmento e os serviços de interesse. Use bullet points curtos e objetivos.\n\n${descreverEmpresa(e)}`,
  }),
  videos: (e) => ({
    system: `${SYSTEM_BASE} Sua tarefa é sugerir ideias de conteúdo em vídeo.`,
    user: `Sugira de 6 a 8 ideias de vídeos para redes sociais que a MarketForge poderia produzir para esta empresa caso feche contrato, adequadas ao segmento dela. Para cada ideia, dê um título curto e uma linha explicando o conceito.\n\n${descreverEmpresa(e)}`,
  }),
  instagram: (e) => ({
    system: `${SYSTEM_BASE} Sua tarefa é montar um diagnóstico rápido de Instagram para usar como gancho de vendas.`,
    user: `Monte um diagnóstico rápido (formato de checklist) dos pontos mais comuns que costumam estar fracos no Instagram de empresas deste segmento (ex: bio, destaques, frequência de posts, uso de reels, resposta a comentários/DM, link na bio, identidade visual) e como a MarketForge pode ajudar a resolver cada ponto. Deixe claro que é uma análise geral baseada no segmento, já que o perfil não foi acessado diretamente.\n\n${descreverEmpresa(e)}`,
  }),
  proposta: (e) => ({
    system: `${SYSTEM_BASE} Sua tarefa é redigir um rascunho de proposta comercial.`,
    user: `Redija um rascunho de proposta comercial para esta empresa, com as seções: Objetivo, Escopo dos serviços (baseado nos serviços de interesse informados), Diferenciais da MarketForge, Investimento mensal${e.valor_estimado ? " (use o valor estimado informado como referência)" : " (deixe um espaço para o valor a ser definido)"} e Próximos passos.\n\n${descreverEmpresa(e)}`,
  }),
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENAI_API_KEY não configurada no servidor." }, { status: 500 });
  }

  let body: { tipo?: string; empresa?: Empresa };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { tipo, empresa } = body;
  if (!tipo || !PROMPTS[tipo]) {
    return Response.json({ error: "Tipo de conteúdo inválido." }, { status: 400 });
  }

  const { system, user } = PROMPTS[tipo](empresa || {});

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.8,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      return Response.json({ error: json?.error?.message || "Erro ao consultar a OpenAI." }, { status: 502 });
    }

    const texto = json?.choices?.[0]?.message?.content?.trim();
    if (!texto) {
      return Response.json({ error: "A IA não retornou conteúdo." }, { status: 502 });
    }

    return Response.json({ texto });
  } catch {
    return Response.json({ error: "Falha de rede ao gerar conteúdo com IA." }, { status: 502 });
  }
}

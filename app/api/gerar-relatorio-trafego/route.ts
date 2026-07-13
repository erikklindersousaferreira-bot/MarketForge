import type { NextRequest } from "next/server";

type Metricas = {
  clienteNome?: string;
  campanhaNome?: string;
  objetivo?: string;
  dias?: number;
  valorInvestido?: number;
  valorGasto?: number | null;
  totalMensagens?: number;
  mediaDiaria?: number;
  melhorDia?: { dia: string; mensagens: number } | null;
  piorDia?: { dia: string; mensagens: number } | null;
  custoPorMensagem?: number | null;
  qtdVendas?: number | null;
  valorProduto?: number | null;
  faturamentoEstimado?: number | null;
  roi?: number | null;
};

const descreverMetricas = (m: Metricas) => {
  const linhas = [
    `Cliente: ${m.clienteNome || "não informado"}`,
    `Campanha: ${m.campanhaNome || "não informada"}`,
    `Objetivo da campanha: ${m.objetivo || "não informado"}`,
    `Duração da campanha: ${m.dias ?? "?"} dias`,
    `Valor investido: R$ ${Number(m.valorInvestido || 0).toFixed(2)}`,
  ];
  if (m.valorGasto != null) linhas.push(`Valor efetivamente gasto: R$ ${Number(m.valorGasto).toFixed(2)}`);
  linhas.push(`Total de mensagens recebidas no período: ${m.totalMensagens ?? 0}`);
  linhas.push(`Média de mensagens por dia: ${m.mediaDiaria ?? 0}`);
  if (m.melhorDia) linhas.push(`Melhor dia: ${m.melhorDia.dia} com ${m.melhorDia.mensagens} mensagens`);
  if (m.piorDia) linhas.push(`Pior dia: ${m.piorDia.dia} com ${m.piorDia.mensagens} mensagens`);
  if (m.custoPorMensagem != null) linhas.push(`Custo por mensagem: R$ ${Number(m.custoPorMensagem).toFixed(2)}`);
  if (m.qtdVendas != null) linhas.push(`Quantidade de vendas registradas: ${m.qtdVendas}`);
  if (m.valorProduto != null) linhas.push(`Valor do produto/serviço vendido: R$ ${Number(m.valorProduto).toFixed(2)}`);
  if (m.faturamentoEstimado != null) linhas.push(`Faturamento estimado: R$ ${Number(m.faturamentoEstimado).toFixed(2)}`);
  if (m.roi != null) linhas.push(`ROI estimado: ${Number(m.roi).toFixed(1)}%`);
  return linhas.join("\n");
};

const SYSTEM = "Você é um especialista sênior em marketing de performance e tráfego pago de uma agência brasileira chamada MarketForge, escrevendo um relatório para ser lido diretamente pelo cliente final. Escreva sempre em português do Brasil, em tom profissional, claro e direto, como um especialista experiente. Nunca invente números ou dados que não foram fornecidos — use apenas os dados informados. Nunca prometa resultados futuros. Nunca use linguagem exagerada, sensacionalista ou promessas vazias. Destaque pontos positivos primeiro, mas seja honesto sobre limitações dos dados quando fizer sentido.";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENAI_API_KEY não configurada no servidor." }, { status: 500 });
  }

  let body: Metricas;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const dados = descreverMetricas(body || {});

  const userPrompt = `Com base nos dados de campanha de tráfego pago abaixo, gere um relatório em formato JSON com exatamente estas 3 chaves: "resumo_executivo" (2 a 3 frases resumindo o desempenho geral da campanha), "analise_resultados" (um parágrafo em tom profissional, destacando pontos positivos primeiro, analisando os números apresentados sem inventar dados e sem prometer resultados futuros), "recomendacoes" (uma lista de recomendações personalizadas em formato de array de strings — escolha apenas entre: testar novos criativos, testar novos públicos, aumentar o investimento gradualmente, manter a campanha como está, criar campanha de remarketing, otimizar os anúncios atuais — e só inclua as que fizerem sentido para os números apresentados, cada item deve ser uma frase curta e específica ao contexto).\n\nDados da campanha:\n${dados}\n\nResponda APENAS com o JSON, sem markdown, sem texto adicional.`;

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
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.6,
        response_format: { type: "json_object" },
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

    let parsed: { resumo_executivo?: string; analise_resultados?: string; recomendacoes?: string[] };
    try {
      parsed = JSON.parse(texto);
    } catch {
      return Response.json({ error: "A IA retornou um formato inválido." }, { status: 502 });
    }

    return Response.json({
      resumo_executivo: parsed.resumo_executivo || "",
      analise_resultados: parsed.analise_resultados || "",
      recomendacoes: Array.isArray(parsed.recomendacoes) ? parsed.recomendacoes : [],
    });
  } catch {
    return Response.json({ error: "Falha de rede ao gerar conteúdo com IA." }, { status: 502 });
  }
}

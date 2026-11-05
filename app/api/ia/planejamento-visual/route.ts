// app/api/ia/planejamento-visual/route.ts
// Transforma o texto do planejamento (escrito/ditado pelo Erik) no planejamento visual estruturado.
// Também ajusta um planejamento já gerado a partir de uma instrução. SOMENTE server-side.
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient, createAdminClient } from "@/lib/supabase-server";
import type { EstruturaPlanejamento } from "@/lib/planejamento-tipos";
import { obterSkill, obterChaveOpenAI } from "@/lib/ia-skill";

export const maxDuration = 60;

const ESQUEMA = `{
  "subtitulo": "linha curta da capa, ex.: Programações · Restaurante · Delivery",
  "introducao": "1 frase opcional de abertura",
  "objetivos": [{ "titulo": "...", "descricao": "..." }],
  "rotina": {
    "titulo": "ex.: Stories diários", "subtitulo": "ex.: Trabalhados todos os dias", "frequencia": "ex.: Todos os dias",
    "itens": [{ "titulo": "...", "descricao": "..." }],
    "observacao": "opcional",
    "destaque": { "titulo": "ex.: Sábado e domingo", "texto": "...", "tags": ["...", "..."] }
  },
  "frentes": {
    "titulo": "ex.: Programações noturnas", "subtitulo": "...",
    "itens": ["Karaokê", "Pagode"],
    "aviso": "opcional, algo a confirmar",
    "como_funciona": [{ "titulo": "...", "descricao": "..." }],
    "objetivo": "opcional"
  },
  "cronograma": {
    "titulo": "ex.: Cronograma dos vídeos", "subtitulo": "...",
    "itens": [{ "quando": "19/10 ou 'A cada ~4 dias' ou 'Sempre'", "titulo": "...", "descricao": "...", "destaque": true }]
  },
  "acoes": {
    "titulo": "ex.: Conteúdo de restaurante", "subtitulo": "...",
    "itens": [{ "data": "22/10", "tipo": "Vídeo", "titulo": "...", "objetivo": "...", "status": "programado | pendente" }]
  },
  "proxima_etapa": {
    "titulo": "ex.: Delivery + novo cardápio", "subtitulo": "...", "descricao": "...",
    "itens": ["...", "..."], "objetivo": "...", "status": "..."
  },
  "resumo": {
    "cards": [{ "rotulo": "TODOS OS DIAS", "titulo": "Stories", "descricao": "...", "destaque": false }],
    "ja_programado": ["..."],
    "depende_cliente": ["..."],
    "frase_final": "...",
    "subfrase": "..."
  },
  "conteudos": [{ "titulo": "Vídeo do Pagode", "data": "AAAA-MM-DD ou null", "plataforma": "Instagram", "formato": "Reels",
                  "objetivo": "atração | confiança | desejo | conversão | retenção — e por quê", "gancho": "primeiros segundos",
                  "conceito": "ideia criativa e orientação de gravação", "legenda": "sugestão curta opcional" }],
  "notas_internas": ["observações SÓ PARA A AGÊNCIA (o cliente não vê): pontos fracos do plano, informações que faltam, riscos e sugestões melhores"]
}`;

const TAREFA = `# TAREFA ATUAL — PLANEJAMENTO VISUAL DO MÊS
Você trabalha na MarketForge, agência de marketing de Marabá (PA).
O texto abaixo foi escrito/ditado pela agência explicando o planejamento mensal de um cliente.
Transforme-o em um JSON para uma apresentação visual que o CLIENTE vai ler no celular.
Aplique a skill acima para organizar e fortalecer a estratégia, mas respeite as decisões da agência que estão no texto.

Regras:
- Responda SOMENTE com um objeto JSON válido, seguindo este formato (todas as chaves são opcionais; inclua só as seções que fazem sentido para o texto):
${ESQUEMA}
- Use apenas informações do texto. Não invente datas, programações, preços ou promessas. Se algo ainda não está definido, coloque em "aviso", "status" ou "depende_cliente".
- Português do Brasil, linguagem simples e direta para o dono do negócio. Títulos curtos (até ~6 palavras). Descrições de 1 frase.
- "objetivos": de 1 a 3 itens.
- "rotina.itens": de 2 a 4 itens.
- Datas nos campos de exibição ("quando", "data") no formato DD/MM.
- "conteudos": um item para cada vídeo/post com data definida (formato AAAA-MM-DD, usando o ano e o mês do planejamento). Itens recorrentes ou sem data: data null. Não liste stories diários um por um.
- "resumo.cards": de 3 a 6 cards; marque "destaque": true nos que têm data específica.
- "resumo.depende_cliente": o que o cliente precisa confirmar ou entregar.
- Cada item de "conteudos" deve ter função estratégica clara (campo "objetivo"), um gancho e um conceito de gravação. Nada de conteúdo genérico.
- "notas_internas": 2 a 6 observações diretas para a agência, como um diretor de marketing faria: o que está fraco, o que falta saber, riscos, e alternativas melhores. Se o plano estiver bom, diga o que reforçar. Não repita o texto.
- Como não dá para fazer perguntas aqui, coloque as dúvidas importantes em "notas_internas" (para a agência) ou em "depende_cliente" (para o cliente).`;

export async function POST(req: NextRequest) {
  try {
    // ── Autenticação: admin ou equipe ──
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const admin = createAdminClient();
    const { data: eu } = await admin.from("usuarios").select("papel").eq("id", user.id).single();
    if (!["admin", "equipe"].includes((eu as { papel?: string } | null)?.papel ?? "")) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as { planejamento_id?: string; texto?: string; ajuste?: string };
    if (!body.planejamento_id) return NextResponse.json({ error: "Planejamento não informado." }, { status: 400 });

    const { data: planRaw } = await admin
      .from("planejamentos")
      .select("id, mes_referencia, objetivo, publico_alvo, tom_voz, texto_base, estrutura, status_aprovacao, cliente:cliente_id(nome, segmento)")
      .eq("id", body.planejamento_id)
      .single();
    const plan = planRaw as unknown as {
      id: string; mes_referencia: string; objetivo: string | null; publico_alvo: string | null; tom_voz: string | null;
      texto_base: string | null; estrutura: EstruturaPlanejamento | null; status_aprovacao: string;
      cliente: { nome: string; segmento: string | null } | null;
    } | null;
    if (!plan) return NextResponse.json({ error: "Planejamento não encontrado." }, { status: 404 });

    const texto = (body.texto ?? plan.texto_base ?? "").trim();
    const ajuste = (body.ajuste ?? "").trim();
    if (!ajuste && texto.length < 30) {
      return NextResponse.json({ error: "Escreva um pouco mais sobre o planejamento do mês (pelo menos algumas frases)." }, { status: 400 });
    }
    if (ajuste && !plan.estrutura) {
      return NextResponse.json({ error: "Gere o planejamento primeiro, depois peça ajustes." }, { status: 400 });
    }

    const [key, skill] = await Promise.all([obterChaveOpenAI(), obterSkill()]);
    if (!key) {
      return NextResponse.json({ error: "Chave da OpenAI não configurada. Cole a chave em Configurações → Inteligência Artificial." }, { status: 400 });
    }

    const contexto = [
      `Cliente: ${plan.cliente?.nome ?? "—"}${plan.cliente?.segmento ? ` (${plan.cliente.segmento})` : ""}`,
      `Mês do planejamento: ${plan.mes_referencia?.slice(0, 7)} (ano-mês)`,
      plan.objetivo ? `Objetivo cadastrado: ${plan.objetivo}` : "",
      plan.publico_alvo ? `Público-alvo: ${plan.publico_alvo}` : "",
      plan.tom_voz ? `Tom de voz: ${plan.tom_voz}` : "",
    ].filter(Boolean).join("\n");

    const mensagens: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{ role: "system", content: `${skill}\n\n---\n\n${TAREFA}` }];
    if (ajuste) {
      mensagens.push({
        role: "user",
        content: `${contexto}\n\nTexto original do planejamento:\n${texto || "(não informado)"}\n\nPlanejamento atual (JSON):\n${JSON.stringify(plan.estrutura)}\n\nAplique este ajuste e devolva o JSON completo atualizado:\n${ajuste}`,
      });
    } else {
      mensagens.push({ role: "user", content: `${contexto}\n\nTexto do planejamento do mês:\n${texto}` });
    }

    const openai = new OpenAI({ apiKey: key });
    const resp = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: mensagens,
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 6000,
    });

    let estrutura: EstruturaPlanejamento;
    try {
      estrutura = JSON.parse(resp.choices[0]?.message?.content ?? "{}");
    } catch {
      return NextResponse.json({ error: "A IA devolveu uma resposta inválida. Tente de novo." }, { status: 502 });
    }

    const atualizacao: Record<string, unknown> = { estrutura };
    if (!ajuste) atualizacao.texto_base = texto;
    // Mexeu depois de enviado/aprovado → volta para rascunho até reenviar
    if (plan.status_aprovacao !== "rascunho") atualizacao.status_aprovacao = "rascunho";

    const { error } = await admin.from("planejamentos").update(atualizacao as never).eq("id", plan.id);
    if (error) {
      console.error("[ia-planejamento-visual] erro ao salvar:", error.message);
      return NextResponse.json({ error: "Gerado, mas não foi possível salvar. Rode a etapa 12 do banco." }, { status: 500 });
    }

    return NextResponse.json({ estrutura });
  } catch (err) {
    console.error("[ia-planejamento-visual] erro:", err);
    const msg = err instanceof Error && /api key|401|Incorrect/i.test(err.message)
      ? "A chave da OpenAI foi recusada. Confira em Configurações."
      : "Erro ao gerar com a IA. Tente novamente.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

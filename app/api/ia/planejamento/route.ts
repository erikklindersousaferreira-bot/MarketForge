import { NextRequest } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase-server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    // ── Autenticação ──────────────────────────────────────────
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    // ── Verifica papel (admin ou equipe) ──────────────────────
    const admin = createAdminClient();
    const { data: usuario } = await admin
      .from("usuarios")
      .select("papel")
      .eq("id", user.id)
      .single();

    if (!usuario || !["admin", "equipe"].includes(usuario.papel)) {
      return Response.json({ error: "Acesso negado." }, { status: 403 });
    }

    // ── Payload ───────────────────────────────────────────────
    const body = await req.json();
    const { contexto, instrucao } = body as {
      planejamento_id?: string;
      contexto: string;
      instrucao: string;
    };

    if (!instrucao?.trim()) {
      return Response.json({ error: "Instrução obrigatória." }, { status: 400 });
    }

    // ── Prompt do sistema ─────────────────────────────────────
    const systemPrompt = `Você é um especialista em marketing de conteúdo digital para pequenas e médias empresas brasileiras.
Sua função é ajudar a planejar e criar conteúdo para redes sociais, sites e outras plataformas.

Sempre responda em português do Brasil de forma clara, prática e criativa.
Quando sugerir posts ou conteúdos, forneça:
- Título ou tema do conteúdo
- Plataforma sugerida (Instagram, Facebook, TikTok, etc.)
- Formato (Feed, Stories, Reels, Carrossel, Vídeo, etc.)
- Texto/legenda pronta para usar ou adaptar
- Hashtags relevantes quando aplicável
- Data ou período sugerido quando relevante

Seja direto e forneça conteúdo que possa ser usado imediatamente.`;

    const userMessage = `Contexto do cliente e planejamento:
${contexto}

Instrução:
${instrucao}`;

    // ── Streaming ─────────────────────────────────────────────
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage },
      ],
      stream: true,
      max_tokens: 2000,
      temperature: 0.8,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("Erro na rota IA planejamento:", err);
    return Response.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

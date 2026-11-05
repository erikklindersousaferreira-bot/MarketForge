// app/api/portal/dados/route.ts
// Dados do Portal do cliente, buscados no servidor (service role) depois de conferir
// a qual empresa o usuário logado pertence. Evita bloqueios das regras antigas do banco.
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Faça login novamente." }, { status: 401 });

  const admin = createAdminClient();
  const { data: euRaw } = await admin.from("usuarios").select("nome, papel, cliente_id, ativo").eq("id", user.id).single();
  const eu = euRaw as { nome: string | null; papel: string; cliente_id: string | null; ativo: boolean | null } | null;
  if (!eu || eu.ativo === false) return NextResponse.json({ error: "Acesso desativado. Fale com a MarketForge." }, { status: 403 });

  const ehEquipe = eu.papel === "admin" || eu.papel === "equipe";
  const clienteId = ehEquipe ? req.nextUrl.searchParams.get("cliente") : eu.cliente_id;

  if (!clienteId) {
    return NextResponse.json({
      preview: ehEquipe,
      usuarioNome: eu.nome,
      error: ehEquipe
        ? "Abra a pré-visualização a partir de um planejamento."
        : "Seu acesso ainda não foi ligado a uma empresa. Fale com a MarketForge.",
    });
  }

  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();
  const limite = new Date(hoje); limite.setDate(hoje.getDate() + 30);
  const statusVisiveis = ehEquipe ? ["rascunho", "enviado", "aprovado", "ajuste"] : ["enviado", "aprovado", "ajuste"];

  const [rCli, rPlan, rTar, rEv, rCob] = await Promise.all([
    admin.from("clientes").select("id, nome, logo_url, cor_primaria").eq("id", clienteId).single(),
    admin.from("planejamentos")
      .select("id, mes_referencia, estrutura, status_aprovacao, comentario_cliente, aprovado_cliente_em")
      .eq("cliente_id", clienteId).in("status_aprovacao", statusVisiveis).not("estrutura", "is", null)
      .order("mes_referencia", { ascending: false }).limit(12),
    admin.from("tarefas").select("id, titulo, status, prazo, prioridade, concluida_em, tipo")
      .eq("cliente_id", clienteId).neq("status", "cancelada")
      .order("prazo", { ascending: true, nullsFirst: false }).limit(200),
    admin.from("eventos_agenda").select("id, titulo, tipo, data_inicio, local")
      .eq("cliente_id", clienteId).gte("data_inicio", inicioHoje).lte("data_inicio", limite.toISOString())
      .order("data_inicio").limit(30),
    admin.from("cobrancas").select("id, descricao, valor, vencimento, status")
      .eq("cliente_id", clienteId).in("status", ["pendente", "atrasado"]).order("vencimento").limit(12),
  ]);

  for (const [nome, r] of [["clientes", rCli], ["planejamentos", rPlan], ["tarefas", rTar], ["eventos", rEv], ["cobrancas", rCob]] as const) {
    if (r.error) console.error(`[portal-dados] ${nome}:`, r.error.message);
  }

  return NextResponse.json({
    preview: ehEquipe,
    usuarioNome: eu.nome,
    cliente: rCli.data ?? null,
    planos: rPlan.data ?? [],
    tarefas: rTar.data ?? [],
    eventos: rEv.data ?? [],
    cobrancas: rCob.data ?? [],
  });
}

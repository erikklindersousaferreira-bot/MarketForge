// app/api/portal/aprovar/route.ts
// O CLIENTE aprova o planejamento do mês ou pede ajuste. SOMENTE server-side.
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Faça login novamente." }, { status: 401 });

  const admin = createAdminClient();
  const { data: euRaw } = await admin.from("usuarios").select("nome, papel, cliente_id").eq("id", user.id).single();
  const eu = euRaw as { nome: string | null; papel: string; cliente_id: string | null } | null;
  if (!eu || eu.papel !== "cliente" || !eu.cliente_id) {
    return NextResponse.json({ error: "Só o cliente pode aprovar o planejamento dele." }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { planejamento_id?: string; acao?: "aprovar" | "ajuste"; comentario?: string };
  const comentario = (body.comentario ?? "").trim().slice(0, 2000);
  if (!body.planejamento_id || !["aprovar", "ajuste"].includes(body.acao ?? "")) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (body.acao === "ajuste" && comentario.length < 3) {
    return NextResponse.json({ error: "Conte o que você gostaria de ajustar." }, { status: 400 });
  }

  const { data: planRaw } = await admin
    .from("planejamentos")
    .select("id, cliente_id, status_aprovacao, mes_referencia, cliente:cliente_id(nome)")
    .eq("id", body.planejamento_id)
    .single();
  const plan = planRaw as unknown as { id: string; cliente_id: string; status_aprovacao: string; mes_referencia: string; cliente: { nome: string } | null } | null;
  if (!plan || plan.cliente_id !== eu.cliente_id) {
    return NextResponse.json({ error: "Planejamento não encontrado." }, { status: 404 });
  }
  if (plan.status_aprovacao !== "enviado") {
    return NextResponse.json({ error: "Este planejamento não está aguardando aprovação." }, { status: 409 });
  }

  const aprovar = body.acao === "aprovar";
  const { error } = await admin.from("planejamentos").update({
    status_aprovacao: aprovar ? "aprovado" : "ajuste",
    comentario_cliente: comentario || null,
    aprovado_cliente_em: aprovar ? new Date().toISOString() : null,
  } as never).eq("id", plan.id);
  if (error) {
    console.error("[portal-aprovar] erro:", error.message);
    return NextResponse.json({ error: "Não foi possível salvar. Tente novamente." }, { status: 500 });
  }

  // Aprovado → os conteúdos do plano passam para "aprovado"
  if (aprovar) {
    await admin.from("conteudos").update({ status: "aprovado" } as never)
      .eq("planejamento_id", plan.id).eq("gerado_ia", true).eq("status", "rascunho");
  }

  // Avisa a equipe
  const { data: equipe } = await admin.from("usuarios").select("id").in("papel", ["admin", "equipe"]).eq("ativo", true);
  const mes = new Date(plan.mes_referencia.slice(0, 10) + "T12:00").toLocaleDateString("pt-BR", { month: "long" });
  const nomeCliente = plan.cliente?.nome ?? "Cliente";
  const avisos = ((equipe ?? []) as { id: string }[]).map((u) => ({
    usuario_id: u.id,
    titulo: aprovar ? `${nomeCliente} aprovou o planejamento` : `${nomeCliente} pediu ajuste no planejamento`,
    mensagem: aprovar ? `Planejamento de ${mes} aprovado${comentario ? `: "${comentario}"` : "."}` : `"${comentario}"`,
    tipo: aprovar ? "sucesso" : "alerta",
    url: "/planejamento",
    lida: false,
  }));
  if (avisos.length) {
    const { error: errAviso } = await admin.from("notificacoes").insert(avisos as never);
    if (errAviso) console.warn("[portal-aprovar] aviso não enviado:", errAviso.message);
  }

  return NextResponse.json({ success: true, status: aprovar ? "aprovado" : "ajuste" });
}

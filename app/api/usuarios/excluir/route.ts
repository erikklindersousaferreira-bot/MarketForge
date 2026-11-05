// app/api/usuarios/excluir/route.ts
// Exclui um usuário (login + cadastro). SOMENTE server-side, service role.
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { exigirAdmin } from "@/lib/admin-api";

export async function POST(req: NextRequest) {
  const auth = await exigirAdmin();
  if ("resposta" in auth) return auth.resposta;

  const { usuario_id } = (await req.json().catch(() => ({}))) as { usuario_id?: string };
  if (!usuario_id) {
    return NextResponse.json({ error: "Usuário não informado." }, { status: 400 });
  }
  if (usuario_id === auth.adminId) {
    return NextResponse.json({ error: "Você não pode excluir a sua própria conta." }, { status: 400 });
  }

  const admin = createAdminClient();
  // Sem tipagem aqui: algumas tabelas vieram do sistema antigo
  const db = admin as unknown as {
    from: (t: string) => {
      update: (v: Record<string, null>) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
      delete: () => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
      select: (c: string, o?: { count: "exact"; head: true }) => { eq: (c: string, v: string) => Promise<{ count: number | null; error: { message: string } | null }> };
    };
  };

  // Não apaga histórico de conversa: se tiver mensagens, pede para desativar
  const { count: qtdMensagens } = await db.from("mensagens").select("id", { count: "exact", head: true }).eq("autor_id", usuario_id);
  if ((qtdMensagens ?? 0) > 0) {
    return NextResponse.json(
      { error: `Este usuário tem ${qtdMensagens} mensagem(ns) no chat. Para não apagar o histórico, desative o usuário em vez de excluir.` },
      { status: 409 }
    );
  }

  // Solta os vínculos (o registro fica, só sem responsável)
  const desvincular: [string, string][] = [
    ["tarefas", "responsavel_id"], ["tarefas", "criado_por"],
    ["clientes", "responsavel_id"],
    ["eventos_agenda", "responsavel_id"], ["eventos_agenda", "criado_por"],
    ["leads", "responsavel_id"], ["leads", "criado_por"],
    ["interacoes_lead", "usuario_id"],
    ["despesas", "criado_por"],
  ];
  for (const [tabela, coluna] of desvincular) {
    const { error } = await db.from(tabela).update({ [coluna]: null }).eq(coluna, usuario_id);
    if (error) console.warn(`[excluir-usuario] ${tabela}.${coluna}:`, error.message);
  }

  // Dados pessoais do usuário
  for (const tabela of ["notificacoes", "push_subscriptions", "participantes_conversa", "pontuacao_equipe"]) {
    const { error } = await db.from(tabela).delete().eq("usuario_id", usuario_id);
    if (error) console.warn(`[excluir-usuario] ${tabela}:`, error.message);
  }

  // Cadastro
  const { error: erroCadastro } = await db.from("usuarios").delete().eq("id", usuario_id);
  if (erroCadastro) {
    console.error("[excluir-usuario] erro ao excluir cadastro:", erroCadastro.message);
    return NextResponse.json(
      { error: "Não foi possível excluir: este usuário ainda está ligado a outros registros. Desative em vez de excluir." },
      { status: 409 }
    );
  }

  // Login (se existir — usuários do sistema antigo podem não ter)
  const { error: erroAuth } = await admin.auth.admin.deleteUser(usuario_id);
  if (erroAuth && !/not found/i.test(erroAuth.message)) {
    console.warn("[excluir-usuario] cadastro excluído, mas o login não:", erroAuth.message);
  }

  return NextResponse.json({ success: true });
}

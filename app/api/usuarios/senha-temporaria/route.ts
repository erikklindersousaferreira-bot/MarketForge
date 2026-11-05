// app/api/usuarios/senha-temporaria/route.ts
// Gera uma senha temporária para um usuário (SOMENTE server-side, service role).
// O usuário é obrigado a trocar a senha no primeiro acesso (primeiro_acesso = true).
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { exigirAdmin, gerarSenhaTemporaria } from "@/lib/admin-api";

export async function POST(req: NextRequest) {
  const auth = await exigirAdmin();
  if ("resposta" in auth) return auth.resposta;

  const { usuario_id } = (await req.json().catch(() => ({}))) as { usuario_id?: string };
  if (!usuario_id) {
    return NextResponse.json({ error: "Usuário não informado." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: alvo } = await admin.from("usuarios").select("id, nome, email").eq("id", usuario_id).single();
  const usuario = alvo as { id: string; nome: string | null; email: string | null } | null;
  if (!usuario) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const senha = gerarSenhaTemporaria();

  let { error: erroAuth } = await admin.auth.admin.updateUserById(usuario_id, {
    password: senha,
    email_confirm: true,
  });

  // Usuário do sistema antigo sem login: cria o login com o MESMO id
  if (erroAuth && /not found|não encontrado|User not allowed/i.test(erroAuth.message)) {
    if (!usuario.email) {
      return NextResponse.json({ error: "Este usuário está sem e-mail. Edite e coloque um e-mail antes de gerar a senha." }, { status: 400 });
    }
    const criado = await admin.auth.admin.createUser({
      id: usuario_id,
      email: usuario.email.trim().toLowerCase(),
      password: senha,
      email_confirm: true,
    });
    erroAuth = criado.error;
  }

  if (erroAuth) {
    console.error("[senha-temporaria] erro no Auth:", erroAuth.message);
    return NextResponse.json({ error: `Não foi possível gerar a senha: ${erroAuth.message}` }, { status: 500 });
  }

  // Obriga a troca de senha no próximo login
  await admin.from("usuarios").update({ primeiro_acesso: true, ativo: true } as never).eq("id", usuario_id);

  return NextResponse.json({
    success: true,
    senha_temporaria: senha,
    email: usuario.email,
    nome: usuario.nome,
  });
}

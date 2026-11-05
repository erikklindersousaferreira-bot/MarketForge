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

  const { error: erroAuth } = await admin.auth.admin.updateUserById(usuario_id, {
    password: senha,
    email_confirm: true,
  });

  if (erroAuth) {
    console.error("[senha-temporaria] erro no Auth:", erroAuth.message);
    const semLogin = /not found|não encontrado|User not allowed/i.test(erroAuth.message);
    return NextResponse.json(
      {
        error: semLogin
          ? "Este usuário veio do sistema antigo e não tem login. Exclua e crie de novo pelo botão “Novo usuário”."
          : "Não foi possível gerar a senha. Tente novamente.",
      },
      { status: semLogin ? 409 : 500 }
    );
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

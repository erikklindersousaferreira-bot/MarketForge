// app/api/usuarios/criar/route.ts
// ⚠️  Criação de usuário APENAS server-side via service role (Admin Client)
// Nunca expor SUPABASE_SERVICE_ROLE_KEY no front-end.

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createServerClient } from "@/lib/supabase-server";
import { gerarSenhaTemporaria } from "@/lib/admin-api";

export async function POST(req: NextRequest) {
  // 1. Verificar se quem chama é admin autenticado
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // Buscar papel do usuário logado
  const { data: usuarioLogado } = await supabase
    .from("usuarios")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (usuarioLogado?.papel !== "admin") {
    return NextResponse.json({ error: "Acesso negado. Apenas administradores podem criar usuários." }, { status: 403 });
  }

  // 2. Extrair dados da requisição
  const body = await req.json();
  const { nome, email, papel, cliente_id } = body as {
    nome: string;
    email: string;
    papel: "admin" | "equipe" | "cliente";
    cliente_id?: string;
  };

  if (!nome?.trim() || !email?.trim() || !papel) {
    return NextResponse.json({ error: "Nome, e-mail e papel são obrigatórios." }, { status: 400 });
  }

  if (papel === "cliente" && !cliente_id) {
    return NextResponse.json({ error: "Usuários do tipo cliente precisam estar vinculados a um cliente." }, { status: 400 });
  }

  // 3. Criar usuário via Admin Client (service role)
  const admin = createAdminClient();
  const senhaTemporaria = gerarSenhaTemporaria();
  const emailNorm = email.trim().toLowerCase();

  // Cadastro antigo (do sistema anterior) com o mesmo e-mail e sem login:
  // reaproveita o mesmo ID para não duplicar e manter os vínculos.
  const { data: existente } = await admin
    .from("usuarios")
    .select("id")
    .ilike("email", emailNorm)
    .limit(1)
    .maybeSingle();
  const idExistente = (existente as { id?: string } | null)?.id;
  if (idExistente) {
    const { data: jaTemLogin } = await admin.auth.admin.getUserById(idExistente);
    if (jaTemLogin?.user) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado. Use o botão 🔑 do usuário para gerar uma senha temporária." }, { status: 409 });
    }
  }

  const { data: authData, error: createError } = await admin.auth.admin.createUser({
    ...(idExistente ? { id: idExistente } : {}),
    email: emailNorm,
    password: senhaTemporaria,    // senha temporária — troca obrigatória no 1º acesso
    email_confirm: true,          // confirma e-mail automaticamente
    user_metadata: {
      nome: nome.trim(),
      papel,
      cliente_id: cliente_id ?? null,
    },
  });

  if (createError) {
    // E-mail já cadastrado
    if (createError.message.includes("already registered") || createError.message.includes("already been registered")) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado no sistema." }, { status: 409 });
    }
    console.error("[criar-usuario] Erro Supabase Auth:", createError);
    return NextResponse.json({ error: `Erro ao criar login: ${createError.message}` }, { status: 500 });
  }

  const novoUserId = authData.user?.id;
  if (!novoUserId) {
    return NextResponse.json({ error: "Falha ao obter ID do usuário criado." }, { status: 500 });
  }

  // 4. Gravar na tabela usuarios (service role, já verificamos que quem chama é admin)
  const { error: dbError } = await admin
    .from("usuarios")
    .upsert({
      id:           novoUserId,
      nome:         nome.trim(),
      email:        emailNorm,
      papel,
      perfil:       papel,               // coluna do sistema antigo
      cliente_id:   cliente_id ?? null,
      ativo:        true,
      primeiro_acesso: true,
    } as never, { onConflict: "id" });

  if (dbError) {
    console.error("[criar-usuario] Erro ao inserir em usuarios:", dbError);
    // Desfaz o login criado agora (nunca apaga um cadastro antigo reaproveitado)
    await admin.auth.admin.deleteUser(novoUserId);
    return NextResponse.json({ error: `Erro ao registrar usuário: ${dbError.message}` }, { status: 500 });
  }

  // 5. Devolve a senha temporária para o admin repassar (ela só aparece agora)
  return NextResponse.json({
    success: true,
    usuario_id: novoUserId,
    senha_temporaria: senhaTemporaria,
    email: email.trim().toLowerCase(),
    nome: nome.trim(),
  });
}

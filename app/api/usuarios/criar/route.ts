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

  const { data: authData, error: createError } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
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
    return NextResponse.json({ error: "Erro ao criar usuário. Tente novamente." }, { status: 500 });
  }

  const novoUserId = authData.user?.id;
  if (!novoUserId) {
    return NextResponse.json({ error: "Falha ao obter ID do usuário criado." }, { status: 500 });
  }

  // 4. Inserir na tabela usuarios (o trigger pode já ter feito isso, mas garantimos)
  const { error: dbError } = await supabase
    .from("usuarios")
    .upsert({
      id:           novoUserId,
      nome:         nome.trim(),
      email:        email.trim().toLowerCase(),
      papel,
      cliente_id:   cliente_id ?? null,
      ativo:        true,
      primeiro_acesso: true,
    }, { onConflict: "id" });

  if (dbError) {
    console.error("[criar-usuario] Erro ao inserir em usuarios:", dbError);
    // Tentar desfazer criação no Auth
    await admin.auth.admin.deleteUser(novoUserId);
    return NextResponse.json({ error: "Erro ao registrar usuário. Tente novamente." }, { status: 500 });
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

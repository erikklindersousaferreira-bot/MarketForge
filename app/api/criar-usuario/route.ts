// app/api/criar-usuario/route.ts
// Criação e edição de usuários via Supabase Admin (service_role).
// NUNCA exponha a service_role key no front-end.

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // nunca exposta no client
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST /api/criar-usuario — cria novo usuário com senha temporária
export async function POST(req: NextRequest) {
  try {
    const { nome, email, senha, papel, cliente_id } = await req.json();

    if (!nome || !email || !senha || !papel) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }
    if (senha.length < 6) {
      return NextResponse.json({ error: "Senha deve ter no mínimo 6 caracteres." }, { status: 400 });
    }

    // 1. Cria o usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true, // pula confirmação por e-mail
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || "Erro ao criar usuário no Auth." }, { status: 500 });
    }

    // 2. Insere na tabela usuarios
    const { data: usuario, error: dbError } = await supabaseAdmin
      .from("usuarios")
      .insert([{
        id: authData.user.id,
        email,
        nome,
        papel,
        cliente_id: papel === "cliente" ? cliente_id : null,
        ativo: true,
      }])
      .select()
      .single();

    if (dbError) {
      // Rollback: remove do Auth para não deixar órfão
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ usuario });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Erro interno." }, { status: 500 });
  }
}

// PATCH /api/criar-usuario — redefine senha de um usuário existente
export async function PATCH(req: NextRequest) {
  try {
    const { userId, novaSenha } = await req.json();

    if (!userId || !novaSenha || novaSenha.length < 6) {
      return NextResponse.json({ error: "userId e novaSenha (mín. 6 chars) são obrigatórios." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: novaSenha,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Erro interno." }, { status: 500 });
  }
}

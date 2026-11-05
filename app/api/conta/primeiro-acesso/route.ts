// app/api/conta/primeiro-acesso/route.ts
// Marca que o usuário logado já trocou a senha (primeiro_acesso = false).
// Feito no servidor porque clientes não têm permissão de alterar o próprio cadastro.
import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase-server";

export async function POST() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Faça login novamente." }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("usuarios")
    .update({ primeiro_acesso: false } as never)
    .eq("id", user.id)
    .select("papel")
    .single();

  if (error) {
    console.error("[primeiro-acesso] erro:", error.message);
    return NextResponse.json({ error: "Senha trocada, mas não foi possível concluir. Tente entrar de novo." }, { status: 500 });
  }

  const papel = (data as { papel?: string } | null)?.papel;
  return NextResponse.json({ success: true, destino: papel === "cliente" ? "/portal" : "/painel" });
}

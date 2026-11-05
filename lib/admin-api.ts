// lib/admin-api.ts — Utilitários das rotas de API administrativas (SOMENTE server-side)
import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

/** Garante que quem chama é um admin logado. Retorna o id do admin ou uma resposta de erro. */
export async function exigirAdmin(): Promise<{ adminId: string } | { resposta: NextResponse }> {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { resposta: NextResponse.json({ error: "Não autorizado." }, { status: 401 }) };
  }
  const { data: logado } = await supabase.from("usuarios").select("papel").eq("id", user.id).single();
  if ((logado as { papel?: string } | null)?.papel !== "admin") {
    return { resposta: NextResponse.json({ error: "Apenas administradores podem fazer isso." }, { status: 403 }) };
  }
  return { adminId: user.id };
}

/** Senha temporária legível (sem 0/O, 1/l/I), ex.: Forge-7K4P-92QX */
export function gerarSenhaTemporaria(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bloco = () => Array.from({ length: 4 }, () => chars[randomInt(chars.length)]).join("");
  return `Forge-${bloco()}-${bloco()}`;
}

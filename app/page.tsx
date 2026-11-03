// app/page.tsx — Redireciona para /painel ou /login
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";

export default async function RootPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Verificar papel do usuário
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("papel, primeiro_acesso")
      .eq("id", user.id)
      .single();

    if (usuario?.primeiro_acesso) {
      redirect("/redefinir-senha");
    }

    if (usuario?.papel === "cliente") {
      redirect("/portal");
    }

    redirect("/painel");
  }

  redirect("/login");
}

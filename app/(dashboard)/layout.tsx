// app/(dashboard)/layout.tsx — Layout protegido do dashboard
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { AppLayout } from "@/components/layout/AppLayout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, nome, email, papel, avatar_url, primeiro_acesso")
    .eq("id", user.id)
    .single();

  if (!usuario) {
    redirect("/login");
  }

  if (usuario.primeiro_acesso) {
    redirect("/redefinir-senha");
  }

  // Clientes só acessam o portal
  if (usuario.papel === "cliente") {
    redirect("/portal");
  }

  return <AppLayout usuario={usuario}>{children}</AppLayout>;
}

// app/portal/layout.tsx — Área do cliente (fora do painel administrativo)
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Meu planejamento",
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("papel, primeiro_acesso, ativo")
    .eq("id", user.id)
    .single();

  const u = usuario as { papel?: string; primeiro_acesso?: boolean; ativo?: boolean } | null;
  if (!u) redirect("/login");
  if (u.primeiro_acesso) redirect("/redefinir-senha");

  // Cliente usa o portal; admin/equipe podem abrir para pré-visualizar (?cliente=ID)
  if (!["cliente", "admin", "equipe"].includes(u.papel ?? "")) redirect("/login");

  return (
    <div style={{ minHeight: "100vh", background: "#0B0B0B", color: "#fff" }}>
      {children}
    </div>
  );
}

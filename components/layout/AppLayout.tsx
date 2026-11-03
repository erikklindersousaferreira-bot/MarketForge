"use client";

// components/layout/AppLayout.tsx — Shell principal do dashboard
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { Usuario } from "@/lib/types";

interface AppLayoutProps {
  usuario: Pick<Usuario, "id" | "nome" | "email" | "papel" | "avatar_url">;
  children: React.ReactNode;
}

// Mapeamento de rotas para títulos
const TITULOS: Record<string, string> = {
  "/painel":        "Painel",
  "/clientes":      "Clientes",
  "/financeiro":    "Financeiro",
  "/planejamento":  "Planejamento",
  "/conteudos":     "Conteúdos",
  "/tarefas":       "Tarefas",
  "/agenda":        "Agenda",
  "/prospeccao":    "Prospecção",
  "/mensagens":     "Mensagens",
  "/usuarios":      "Usuários e Acessos",
  "/relatorios":    "Relatórios",
  "/configuracoes": "Configurações",
};

function getTitulo(pathname: string): string {
  const segmento = "/" + pathname.split("/")[1];
  return TITULOS[segmento] ?? "MarketForge";
}

// Ícones mobile nav (apenas funções principais)
function IconPainel() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
}
function IconTarefas() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
}
function IconClientes() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function IconMensagens() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
}
function IconFinanceiro() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
}

const mobileNavItems = [
  { href: "/painel",     label: "Painel",     icon: <IconPainel /> },
  { href: "/tarefas",    label: "Tarefas",    icon: <IconTarefas /> },
  { href: "/clientes",   label: "Clientes",   icon: <IconClientes /> },
  { href: "/mensagens",  label: "Mensagens",  icon: <IconMensagens /> },
  { href: "/financeiro", label: "Financeiro", icon: <IconFinanceiro /> },
];

export function AppLayout({ usuario, children }: AppLayoutProps) {
  const pathname = usePathname();
  const titulo = getTitulo(pathname);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuAberto, setMobileMenuAberto] = useState(false);

  // Fechar menu mobile ao mudar de rota
  useEffect(() => {
    setMobileMenuAberto(false);
  }, [pathname]);

  // Persistir preferência de sidebar colapsada
  useEffect(() => {
    const saved = localStorage.getItem("mf-sidebar-collapsed");
    if (saved === "true") setSidebarCollapsed(true);
  }, []);

  function handleToggleSidebar() {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("mf-sidebar-collapsed", String(next));
  }

  return (
    <>
      {/* Overlay mobile */}
      {mobileMenuAberto && (
        <div
          onClick={() => setMobileMenuAberto(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 35,
          }}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        usuario={usuario}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Sidebar mobile (sobrepõe) */}
      {mobileMenuAberto && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, pointerEvents: "none" }}>
          <div style={{ pointerEvents: "auto" }}>
            <Sidebar
              usuario={usuario}
              collapsed={false}
              onToggleCollapse={() => setMobileMenuAberto(false)}
            />
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div
        className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}
      >
        <Topbar
          usuario={usuario}
          titulo={titulo}
          onMenuMobile={() => setMobileMenuAberto(true)}
        />

        <main
          className="page-content"
          style={{ margin: "0 auto" }}
        >
          {children}
        </main>
      </div>

      {/* Navegação inferior mobile */}
      <nav className="mobile-nav" aria-label="Navegação mobile">
        {mobileNavItems.map((item) => {
          const isActive =
            item.href === "/painel"
              ? pathname === "/painel"
              : pathname.startsWith(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              className={`mobile-nav-item${isActive ? " active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
}

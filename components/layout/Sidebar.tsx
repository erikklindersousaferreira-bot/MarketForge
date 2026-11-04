"use client";

// components/layout/Sidebar.tsx
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Usuario } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function IconPainel() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
function IconClientes() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconFinanceiro() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function IconPlanejamento() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
function IconConteudos() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
    </svg>
  );
}
function IconTarefas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
function IconAgenda() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconProspeccao() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconMensagens() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconUsuarios() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconRelatorios() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function IconConfiguracoes() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  );
}
function IconSeta({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 250ms ease" }}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const navItems: NavItem[] = [
  { href: "/painel",      label: "Painel",       icon: <IconPainel /> },
  { href: "/clientes",    label: "Clientes",     icon: <IconClientes /> },
  { href: "/financeiro",  label: "Financeiro",   icon: <IconFinanceiro /> },
  { href: "/planejamento",label: "Planejamento", icon: <IconPlanejamento /> },
  { href: "/conteudos",   label: "Conteúdos",    icon: <IconConteudos /> },
  { href: "/tarefas",     label: "Tarefas",      icon: <IconTarefas /> },
  { href: "/agenda",      label: "Agenda",       icon: <IconAgenda /> },
  { href: "/prospeccao",  label: "Prospecção",   icon: <IconProspeccao /> },
  { href: "/mensagens",   label: "Mensagens",    icon: <IconMensagens /> },
  { href: "/usuarios",    label: "Usuários",     icon: <IconUsuarios /> },
  { href: "/relatorios",  label: "Relatórios",   icon: <IconRelatorios /> },
  { href: "/configuracoes",label: "Configurações",icon: <IconConfiguracoes /> },
];

interface SidebarProps {
  usuario: Pick<Usuario, "id" | "nome" | "email" | "papel" | "avatar_url">;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ usuario, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function getInitials(nome: string) {
    return nome
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  return (
    <aside
      className={`sidebar${collapsed ? " sidebar-collapsed" : ""}`}
      aria-label="Navegação principal"
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "1rem 0" : "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Link
            href="/painel"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#FF6A00",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
              </svg>
            </div>
            <span
              style={{
                fontSize: "1rem",
                fontWeight: 800,
                color: "white",
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
              }}
            >
              MarketForge
            </span>
          </Link>
        )}

        {collapsed && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#FF6A00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
            </svg>
          </div>
        )}

        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            style={{
              background: "transparent",
              border: "none",
              color: "#71717A",
              cursor: "pointer",
              padding: "0.25rem",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
            }}
            title="Recolher menu"
          >
            <IconSeta collapsed={collapsed} />
          </button>
        )}
      </div>

      {/* Botão expandir (quando collapsed) */}
      {collapsed && (
        <button
          onClick={onToggleCollapse}
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "0.5rem",
            background: "transparent",
            border: "none",
            color: "#71717A",
            cursor: "pointer",
            width: "100%",
          }}
          title="Expandir menu"
        >
          <IconSeta collapsed={collapsed} />
        </button>
      )}

      {/* Navegação */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          paddingTop: "0.5rem",
          paddingBottom: "0.5rem",
        }}
      >
        {navItems.map((item) => {
          const isActive =
            item.href === "/painel"
              ? pathname === "/painel"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item${isActive ? " active" : ""}`}
              title={collapsed ? item.label : undefined}
              style={collapsed ? { justifyContent: "center", margin: "0 0.5rem", padding: "0.625rem" } : {}}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé do sidebar — usuário + logout */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: collapsed ? "0.75rem 0" : "0.75rem 1rem",
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              marginBottom: "0.5rem",
            }}
          >
            <div className="mf-avatar" style={{ flexShrink: 0 }}>
              {usuario.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={usuario.avatar_url}
                  alt={usuario.nome}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                />
              ) : (
                getInitials(usuario.nome)
              )}
            </div>
            <div style={{ overflow: "hidden", minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "white",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {usuario.nome}
              </div>
              <div
                style={{
                  fontSize: "0.6875rem",
                  color: "#71717A",
                  textTransform: "capitalize",
                }}
              >
                {usuario.papel}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="mf-btn-ghost"
          style={
            collapsed
              ? { justifyContent: "center", margin: "0 0.5rem", padding: "0.625rem", width: "auto" }
              : {}
          }
          title={collapsed ? "Sair" : undefined}
        >
          <IconLogout />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}

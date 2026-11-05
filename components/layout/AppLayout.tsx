"use client";

// components/layout/AppLayout.tsx — Shell principal do dashboard
// Desktop: sidebar + topbar. Celular: topbar compacta + abas inferiores estilo app + menu "Mais".
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { supabase } from "@/lib/supabase";
import type { Usuario } from "@/lib/types";

interface AppLayoutProps {
  usuario: Pick<Usuario, "id" | "nome" | "email" | "papel" | "avatar_url">;
  children: React.ReactNode;
}

// Mapeamento de rotas para títulos
const TITULOS: Record<string, string> = {
  "/painel":        "Painel",
  "/dashboard":     "Painel",
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
  "/notificacoes":  "Notificações",
  "/perfil":        "Meu perfil",
};

function getTitulo(pathname: string): string {
  const segmento = "/" + pathname.split("/")[1];
  return TITULOS[segmento] ?? "MarketForge";
}

// ── Ícones ───────────────────────────────────────────────────
type IconProps = { ativo?: boolean };
const base = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function IconPainel({ ativo }: IconProps) {
  return <svg {...base} strokeWidth={ativo ? 2.4 : 1.9}><rect x="3" y="3" width="7" height="7" rx="1.5" fill={ativo ? "currentColor" : "none"} /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" fill={ativo ? "currentColor" : "none"} /><rect x="3" y="14" width="7" height="7" rx="1.5" /></svg>;
}
function IconAgenda({ ativo }: IconProps) {
  return <svg {...base} strokeWidth={ativo ? 2.4 : 1.9}><rect x="3" y="4" width="18" height="18" rx="3" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />{ativo && <rect x="7" y="13" width="4" height="4" rx="1" fill="currentColor" stroke="none" />}</svg>;
}
function IconTarefas({ ativo }: IconProps) {
  return <svg {...base} strokeWidth={ativo ? 2.4 : 1.9}><rect x="3" y="3" width="18" height="18" rx="4" fill={ativo ? "currentColor" : "none"} /><polyline points="8 12 11 15 16 9" stroke={ativo ? "white" : "currentColor"} /></svg>;
}
function IconClientes({ ativo }: IconProps) {
  return <svg {...base} strokeWidth={ativo ? 2.4 : 1.9}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" fill={ativo ? "currentColor" : "none"} /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function IconMais({ ativo }: IconProps) {
  return <svg {...base} strokeWidth={ativo ? 2.4 : 1.9}><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>;
}

// Ícones do menu "Mais"
const ic = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const ICONES_MAIS: Record<string, React.ReactNode> = {
  financeiro:   <svg {...ic}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  planejamento: <svg {...ic}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  conteudos:    <svg {...ic}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>,
  prospeccao:   <svg {...ic}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  mensagens:    <svg {...ic}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  usuarios:     <svg {...ic}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  relatorios:   <svg {...ic}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  configuracoes:<svg {...ic}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  notificacoes: <svg {...ic}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  sair:         <svg {...ic}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
};

const ABAS = [
  { href: "/painel",   label: "Painel",   Icon: IconPainel },
  { href: "/agenda",   label: "Agenda",   Icon: IconAgenda },
  { href: "/tarefas",  label: "Tarefas",  Icon: IconTarefas },
  { href: "/clientes", label: "Clientes", Icon: IconClientes },
];

const MAIS_ITENS = [
  { href: "/financeiro",    label: "Financeiro",    key: "financeiro",    cor: "#16A34A" },
  { href: "/planejamento",  label: "Planejamento",  key: "planejamento",  cor: "#7C3AED" },
  { href: "/conteudos",     label: "Conteúdos",     key: "conteudos",     cor: "#DB2777" },
  { href: "/prospeccao",    label: "Prospecção",    key: "prospeccao",    cor: "#CA8A04" },
  { href: "/mensagens",     label: "Mensagens",     key: "mensagens",     cor: "#2563EB" },
  { href: "/relatorios",    label: "Relatórios",    key: "relatorios",    cor: "#0891B2" },
  { href: "/usuarios",      label: "Usuários",      key: "usuarios",      cor: "#4F46E5" },
  { href: "/notificacoes",  label: "Notificações",  key: "notificacoes",  cor: "#EA580C" },
  { href: "/configuracoes", label: "Ajustes",       key: "configuracoes", cor: "#52525B" },
];

function ativoEm(pathname: string, href: string) {
  if (href === "/painel") return pathname === "/painel" || pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

function iniciais(nome: string) {
  return (nome || "?").split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "?";
}

export function AppLayout({ usuario, children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const titulo = getTitulo(pathname);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [maisAberto, setMaisAberto] = useState(false);

  // Fecha o menu "Mais" ao mudar de rota
  useEffect(() => {
    setMaisAberto(false);
  }, [pathname]);

  // Trava a rolagem do fundo com o menu aberto
  useEffect(() => {
    document.body.style.overflow = maisAberto ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [maisAberto]);

  // Persistir preferência de sidebar colapsada
  useEffect(() => {
    try {
      if (localStorage.getItem("mf-sidebar-collapsed") === "true") setSidebarCollapsed(true);
    } catch { /* sem storage */ }
  }, []);

  // Celular: rótulos das colunas nas tabelas (vira "cartão" no CSS)
  useEffect(() => {
    function rotular() {
      document.querySelectorAll<HTMLTableElement>("table.mf-table").forEach((tabela) => {
        const titulos = Array.from(tabela.querySelectorAll("thead th")).map((th) => th.textContent?.trim() ?? "");
        tabela.querySelectorAll("tbody tr").forEach((tr) => {
          Array.from(tr.children).forEach((td, i) => {
            const rotulo = titulos[i] ?? "";
            if ((td as HTMLElement).dataset.label !== rotulo) (td as HTMLElement).dataset.label = rotulo;
          });
        });
      });
    }
    rotular();
    const obs = new MutationObserver(() => rotular());
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  function handleToggleSidebar() {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try { localStorage.setItem("mf-sidebar-collapsed", String(next)); } catch { /* sem storage */ }
  }

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const maisAtivo = MAIS_ITENS.some((i) => ativoEm(pathname, i.href));

  return (
    <>
      {/* Sidebar (só desktop) */}
      <Sidebar
        usuario={usuario}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Conteúdo principal */}
      <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
        <Topbar usuario={usuario} titulo={titulo} />

        <main className="page-content" style={{ margin: "0 auto" }}>
          {children}
        </main>
      </div>

      {/* ── Abas inferiores (celular) ── */}
      <nav className="mobile-nav" aria-label="Navegação principal">
        {ABAS.map(({ href, label, Icon }) => {
          const ativo = ativoEm(pathname, href);
          return (
            <Link key={href} href={href} className={`mobile-nav-item${ativo ? " active" : ""}`} aria-current={ativo ? "page" : undefined}>
              <Icon ativo={ativo} />
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`mobile-nav-item${maisAtivo || maisAberto ? " active" : ""}`}
          onClick={() => setMaisAberto((v) => !v)}
          aria-expanded={maisAberto}
        >
          <IconMais ativo={maisAtivo || maisAberto} />
          <span>Mais</span>
        </button>
      </nav>

      {/* ── Menu "Mais" (folha que sobe de baixo) ── */}
      {maisAberto && (
        <div className="mf-sheet-overlay" onClick={() => setMaisAberto(false)}>
          <div className="mf-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Mais opções">
            <div className="mf-sheet-handle" />

            {/* Perfil */}
            <Link href="/perfil" className="mf-sheet-perfil">
              <span className="mf-sheet-avatar">
                {usuario.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={usuario.avatar_url} alt={usuario.nome} />
                ) : (
                  iniciais(usuario.nome)
                )}
              </span>
              <span style={{ minWidth: 0 }}>
                <span className="mf-sheet-nome">{usuario.nome}</span>
                <span className="mf-sheet-email">{usuario.email}</span>
              </span>
            </Link>

            {/* Grade de módulos */}
            <div className="mf-sheet-grid">
              {MAIS_ITENS.map((item) => {
                const ativo = ativoEm(pathname, item.href);
                return (
                  <Link key={item.href} href={item.href} className={`mf-sheet-item${ativo ? " active" : ""}`}>
                    <span className="mf-sheet-icone" style={{ background: item.cor + "18", color: item.cor }}>
                      {ICONES_MAIS[item.key]}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <button type="button" className="mf-sheet-sair" onClick={sair}>
              {ICONES_MAIS.sair}
              Sair da conta
            </button>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

// components/layout/Topbar.tsx
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Notificacao, Usuario } from "@/lib/types";

interface TopbarProps {
  usuario: Pick<Usuario, "id" | "nome" | "email" | "papel" | "avatar_url">;
  titulo?: string;
  onMenuMobile?: () => void;
}

function IconSino({ temNaoLidas }: { temNaoLidas: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      {temNaoLidas && (
        <circle cx="18" cy="6" r="4" fill="#FF6A00" stroke="white" strokeWidth="1.5" />
      )}
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconExternalLink() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function getInitials(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getNotificacaoColor(tipo: Notificacao["tipo"]) {
  switch (tipo) {
    case "sucesso": return "#16A34A";
    case "alerta": return "#CA8A04";
    case "erro": return "#DC2626";
    case "tarefa": return "#7C3AED";
    case "financeiro": return "#FF6A00";
    default: return "#2563EB";
  }
}

export function Topbar({ usuario, titulo, onMenuMobile }: TopbarProps) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [painelAberto, setPainelAberto] = useState(false);
  const painelRef = useRef<HTMLDivElement>(null);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  useEffect(() => {
    carregarNotificacoes();

    // Realtime: escutar novas notificações
    const channel = supabase
      .channel("notificacoes-topbar")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificacoes",
          filter: `usuario_id=eq.${usuario.id}`,
        },
        (payload) => {
          setNotificacoes((prev) => [payload.new as Notificacao, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario.id]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (painelRef.current && !painelRef.current.contains(e.target as Node)) {
        setPainelAberto(false);
      }
    }
    if (painelAberto) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [painelAberto]);

  async function carregarNotificacoes() {
    const { data } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("usuario_id", usuario.id)
      .order("criado_em", { ascending: false })
      .limit(30);

    if (data) setNotificacoes(data);
  }

  async function marcarTodasLidas() {
    await supabase
      .from("notificacoes")
      .update({ lida: true })
      .eq("usuario_id", usuario.id)
      .eq("lida", false);

    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  }

  async function marcarLida(id: string) {
    await supabase
      .from("notificacoes")
      .update({ lida: true })
      .eq("id", id);

    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
  }

  function formatarTempo(dataISO: string) {
    const diff = Date.now() - new Date(dataISO).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "agora";
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  }

  return (
    <header className="topbar">
      {/* Esquerda: botão mobile + título */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          className="mf-btn-ghost"
          onClick={onMenuMobile}
          style={{
            display: "none",
            padding: "0.375rem",
            color: "var(--mf-texto-sec)",
          }}
          id="btn-menu-mobile"
          aria-label="Abrir menu"
        >
          <IconMenu />
        </button>
        <style>{`
          @media (max-width: 768px) {
            #btn-menu-mobile { display: flex !important; }
          }
        `}</style>

        {titulo && (
          <h1
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--mf-texto)",
              margin: 0,
            }}
          >
            {titulo}
          </h1>
        )}
      </div>

      {/* Direita: notificações + avatar */}
      <div
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        ref={painelRef}
      >
        {/* Botão notificações */}
        <div style={{ position: "relative" }}>
          <button
            className="mf-btn-ghost"
            onClick={() => setPainelAberto((prev) => !prev)}
            style={{
              padding: "0.5rem",
              color: "var(--mf-texto-sec)",
              position: "relative",
            }}
            aria-label="Notificações"
          >
            <IconSino temNaoLidas={naoLidas > 0} />
            {naoLidas > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  background: "#FF6A00",
                  color: "white",
                  borderRadius: "999px",
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  minWidth: 16,
                  height: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 3px",
                  lineHeight: 1,
                }}
              >
                {naoLidas > 9 ? "9+" : naoLidas}
              </span>
            )}
          </button>

          {/* Painel de notificações */}
          {painelAberto && (
            <div
              className="animate-fade-in"
              style={{
                position: "absolute",
                top: "calc(100% + 0.5rem)",
                right: 0,
                width: 340,
                background: "white",
                border: "1px solid var(--mf-borda)",
                borderRadius: 12,
                boxShadow: "var(--shadow-lg)",
                zIndex: 100,
                overflow: "hidden",
              }}
            >
              {/* Header painel */}
              <div
                style={{
                  padding: "0.875rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--mf-borda)",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>
                  Notificações {naoLidas > 0 && `(${naoLidas})`}
                </span>
                {naoLidas > 0 && (
                  <button
                    onClick={marcarTodasLidas}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--mf-laranja)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Marcar todas lidas
                  </button>
                )}
              </div>

              {/* Lista */}
              <div style={{ maxHeight: 360, overflowY: "auto" }}>
                {notificacoes.length === 0 ? (
                  <div
                    style={{
                      padding: "2rem 1rem",
                      textAlign: "center",
                      color: "var(--mf-texto-sec)",
                      fontSize: "0.875rem",
                    }}
                  >
                    Nenhuma notificação
                  </div>
                ) : (
                  notificacoes.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.lida) marcarLida(n.id);
                        if (n.url) {
                          setPainelAberto(false);
                        }
                      }}
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        padding: "0.875rem 1rem",
                        borderBottom: "1px solid var(--mf-borda)",
                        background: n.lida ? "transparent" : "#FFFBF7",
                        cursor: n.url ? "pointer" : "default",
                        transition: "background 150ms",
                      }}
                    >
                      {/* Dot de cor */}
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: getNotificacaoColor(n.tipo),
                          flexShrink: 0,
                          marginTop: 5,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.8125rem",
                            fontWeight: n.lida ? 400 : 600,
                            color: "var(--mf-texto)",
                            marginBottom: "0.125rem",
                          }}
                        >
                          {n.titulo}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--mf-texto-sec)",
                            lineHeight: 1.4,
                          }}
                        >
                          {n.mensagem}
                        </div>
                        <div
                          style={{
                            fontSize: "0.6875rem",
                            color: "var(--mf-texto-desab)",
                            marginTop: "0.25rem",
                          }}
                        >
                          {formatarTempo(n.criado_em)}
                        </div>
                      </div>
                      {n.url && (
                        <Link
                          href={n.url}
                          onClick={() => setPainelAberto(false)}
                          style={{ color: "var(--mf-texto-sec)", flexShrink: 0 }}
                        >
                          <IconExternalLink />
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar / perfil */}
        <div
          className="mf-avatar"
          style={{ cursor: "default" }}
          title={`${usuario.nome} (${usuario.papel})`}
        >
          {usuario.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={usuario.avatar_url}
              alt={usuario.nome}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          ) : (
            getInitials(usuario.nome)
          )}
        </div>
      </div>
    </header>
  );
}

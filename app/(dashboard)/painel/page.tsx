// app/(dashboard)/painel/page.tsx — Dashboard principal (placeholder para Etapa 9)
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Painel" };

export default async function PainelPage() {
  const supabase = await createServerClient();

  // Contadores rápidos
  const [
    { count: totalClientes },
    { count: totalTarefas },
    { count: cobrancasPendentes },
    { count: tarefasAtrasadas },
  ] = await Promise.all([
    supabase.from("clientes").select("*", { count: "exact", head: true }).eq("status", "ativo"),
    supabase.from("tarefas").select("*", { count: "exact", head: true }).not("status", "in", "(concluida,cancelada)"),
    supabase.from("cobrancas").select("*", { count: "exact", head: true }).in("status", ["pendente", "atrasado"]),
    supabase.from("tarefas").select("*", { count: "exact", head: true }).eq("status", "pendente").lt("prazo", new Date().toISOString()),
  ]);

  const stats = [
    {
      label: "Clientes ativos",
      value: totalClientes ?? 0,
      cor: "#FF6A00",
      icone: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Tarefas em aberto",
      value: totalTarefas ?? 0,
      cor: "#7C3AED",
      icone: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      label: "Cobranças pendentes",
      value: cobrancasPendentes ?? 0,
      cor: "#CA8A04",
      icone: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: "Tarefas atrasadas",
      value: tarefasAtrasadas ?? 0,
      cor: "#DC2626",
      icone: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mf-page-header">
        <div>
          <h1 className="mf-page-title">Painel</h1>
          <p className="mf-page-subtitle">Visão geral da agência</p>
        </div>
      </div>

      {/* Cards de stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="mf-stat-card">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: stat.cor + "1A",
                color: stat.cor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.75rem",
              }}
            >
              {stat.icone}
            </div>
            <div className="mf-stat-value">{stat.value}</div>
            <div className="mf-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Aviso de construção (será removido na Etapa 9) */}
      <div
        style={{
          background: "white",
          border: "1px solid var(--mf-borda)",
          borderRadius: 12,
          padding: "2rem",
          textAlign: "center",
          color: "var(--mf-texto-sec)",
        }}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🚧</div>
        <h3 style={{ fontWeight: 700, color: "var(--mf-texto)", margin: "0 0 0.5rem" }}>
          Dashboard completo em breve
        </h3>
        <p style={{ fontSize: "0.875rem", margin: 0 }}>
          Gráficos, relatórios e KPIs serão implementados na Etapa 9.
          <br />
          Use o menu lateral para acessar os módulos disponíveis.
        </p>
      </div>
    </div>
  );
}

"use client";

// components/financeiro/ResumoMes.tsx — Quanto entra, quanto sai e o lucro de cada mês
import { ArrowDownCircle, ArrowUpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Cob = { id: string; valor: number | null; vencimento: string | null; status: string; data_pagamento: string | null; descricao: string | null; cliente?: { nome: string } | null };
type Parcela = { id: string; valor_parcela: number; vencimento: string; status: string; data_pagamento: string | null; numero_parcela: number };
type Desp = { id: string; descricao: string | null; valor: number | null; vencimento: string | null; status: string; tipo: string | null; categoria: string | null; data_pagamento: string | null; parcelas?: Parcela[] | null };

type Entrada = { id: string; titulo: string; valor: number; pago: boolean; atrasado: boolean };
type Saida = { id: string; titulo: string; categoria: string; valor: number; pago: boolean };

function brl(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function brlCurto(v: number) {
  const a = Math.abs(v);
  const s = a >= 1000 ? `${(a / 1000).toFixed(a >= 10000 ? 0 : 1).replace(".", ",")} mil` : a.toFixed(0);
  return `${v < 0 ? "−" : ""}R$ ${s}`;
}
function chaveMes(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function somaMes(chave: string, n: number) { const [y, m] = chave.split("-").map(Number); return chaveMes(new Date(y, m - 1 + n, 1)); }
function nomeMes(chave: string, curto = false) {
  const [y, m] = chave.split("-").map(Number);
  const t = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", curto ? { month: "short" } : { month: "long", year: "numeric" }).replace(".", "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}
const mesDe = (iso: string | null | undefined) => (iso ? iso.slice(0, 7) : "");

/** Entradas e saídas de um mês */
function calcularMes(chave: string, cobrancas: Cob[], despesas: Desp[], mesAtual: string) {
  const entradas: Entrada[] = cobrancas
    .filter((c) => mesDe(c.vencimento) === chave && c.status !== "cancelado")
    .map((c) => ({
      id: c.id,
      titulo: c.cliente?.nome ? `${c.cliente.nome}${c.descricao ? " · " + c.descricao : ""}` : c.descricao || "Cobrança",
      valor: Number(c.valor) || 0,
      pago: c.status === "pago",
      atrasado: c.status === "atrasado",
    }));

  const saidas: Saida[] = [];
  for (const d of despesas) {
    if (d.status === "cancelado") continue;
    const titulo = d.descricao || "Despesa";
    const categoria = d.categoria || "Sem categoria";
    if (d.tipo === "parcelada" && d.parcelas?.length) {
      for (const p of d.parcelas) {
        if (mesDe(p.vencimento) !== chave || p.status === "cancelado") continue;
        saidas.push({ id: p.id, titulo: `${titulo} (${p.numero_parcela}/${d.parcelas.length})`, categoria, valor: Number(p.valor_parcela) || 0, pago: p.status === "pago" });
      }
    } else if (d.tipo === "fixa") {
      // Fixa: repete todo mês a partir do primeiro vencimento
      if (!d.vencimento || mesDe(d.vencimento) > chave) continue;
      const pagoNoMes = mesDe(d.data_pagamento) === chave || (d.status === "pago" && mesDe(d.vencimento) === chave);
      saidas.push({ id: `${d.id}-${chave}`, titulo, categoria, valor: Number(d.valor) || 0, pago: pagoNoMes || chave < mesAtual });
    } else {
      if (mesDe(d.vencimento) !== chave) continue;
      saidas.push({ id: d.id, titulo, categoria, valor: Number(d.valor) || 0, pago: d.status === "pago" });
    }
  }

  const receita = entradas.reduce((a, e) => a + e.valor, 0);
  const recebido = entradas.filter((e) => e.pago).reduce((a, e) => a + e.valor, 0);
  const despesa = saidas.reduce((a, s) => a + s.valor, 0);
  const pago = saidas.filter((s) => s.pago).reduce((a, s) => a + s.valor, 0);
  return {
    entradas, saidas, receita, recebido, aReceber: receita - recebido,
    despesa, pago, aPagar: despesa - pago,
    lucroPrevisto: receita - despesa, lucroRealizado: recebido - pago,
  };
}

export function ResumoMes() {
  const mesAtual = chaveMes(new Date());
  const [mes, setMes] = useState(mesAtual);
  const [cobrancas, setCobrancas] = useState<Cob[]>([]);
  const [despesas, setDespesas] = useState<Desp[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [rc, rd] = await Promise.all([
      supabase.from("cobrancas").select("id, valor, vencimento, status, data_pagamento, descricao, cliente:cliente_id(nome)").order("vencimento"),
      supabase.from("despesas").select("id, descricao, valor, vencimento, status, tipo, categoria, data_pagamento, parcelas:parcelas_despesas(*)"),
    ]);
    if (rc.error || rd.error) {
      console.error("[resumo financeiro]", rc.error ?? rd.error);
      setErro("Não foi possível carregar o resumo.");
    } else setErro("");
    setCobrancas((rc.data ?? []) as unknown as Cob[]);
    setDespesas((rd.data ?? []) as unknown as Desp[]);
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const atual = useMemo(() => calcularMes(mes, cobrancas, despesas, mesAtual), [mes, cobrancas, despesas, mesAtual]);
  const historico = useMemo(
    () => [-5, -4, -3, -2, -1, 0].map((n) => {
      const k = somaMes(mes, n);
      const r = calcularMes(k, cobrancas, despesas, mesAtual);
      return { chave: k, receita: r.receita, despesa: r.despesa, lucro: r.lucroPrevisto };
    }),
    [mes, cobrancas, despesas, mesAtual]
  );
  const maxBarra = Math.max(1, ...historico.map((h) => Math.max(h.receita, h.despesa)));
  const margem = atual.receita > 0 ? Math.round((atual.lucroPrevisto / atual.receita) * 100) : null;

  const porCategoria = useMemo(() => {
    const m: Record<string, number> = {};
    atual.saidas.forEach((s) => { m[s.categoria] = (m[s.categoria] ?? 0) + s.valor; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [atual.saidas]);

  if (carregando) return <div style={{ padding: "3rem", textAlign: "center" }}><div className="mf-spinner" style={{ margin: "0 auto" }} /></div>;

  const positivo = atual.lucroPrevisto >= 0;

  return (
    <div>
      {/* Navegação de mês */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginBottom: "1rem" }}>
        <button className="mf-btn-secondary" onClick={() => setMes(somaMes(mes, -1))} aria-label="Mês anterior" style={{ padding: "0.5rem 0.625rem" }}><ChevronLeft size={18} /></button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: "1.125rem" }}>{nomeMes(mes)}</div>
          {mes !== mesAtual && (
            <button onClick={() => setMes(mesAtual)} style={{ border: "none", background: "none", color: "var(--mf-laranja)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>Voltar para o mês atual</button>
          )}
        </div>
        <button className="mf-btn-secondary" onClick={() => setMes(somaMes(mes, 1))} aria-label="Próximo mês" style={{ padding: "0.5rem 0.625rem" }}><ChevronRight size={18} /></button>
      </div>

      {erro && <div style={{ background: "var(--mf-vermelho-bg)", color: "var(--mf-vermelho)", borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.875rem", marginBottom: "1rem" }}>{erro}</div>}

      {/* Lucro em destaque */}
      <div
        className="mf-card"
        style={{
          padding: "1.25rem 1.5rem", marginBottom: "1rem", color: "white", border: "none",
          background: positivo ? "linear-gradient(135deg, #16A34A, #15803D)" : "linear-gradient(135deg, #DC2626, #B91C1C)",
        }}
      >
        <div style={{ fontSize: "0.8125rem", opacity: 0.9, fontWeight: 600 }}>Lucro do mês (previsto)</div>
        <div style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15 }}>{brl(atual.lucroPrevisto)}</div>
        <div style={{ fontSize: "0.8125rem", opacity: 0.9, marginTop: 4 }}>
          {brl(atual.receita)} de entrada − {brl(atual.despesa)} de saída
          {margem !== null && ` · margem de ${margem}%`}
        </div>
        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.25)", fontSize: "0.8125rem", display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
          <span>Já realizado (recebido − pago): <strong>{brl(atual.lucroRealizado)}</strong></span>
        </div>
      </div>

      {/* Entradas x saídas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
        <div className="mf-stat-card">
          <span className="mf-stat-label" style={{ display: "flex", alignItems: "center", gap: 6 }}><ArrowDownCircle size={15} color="#16A34A" />Vai entrar (cobranças do mês)</span>
          <span className="mf-stat-value" style={{ color: "var(--mf-verde)" }}>{brl(atual.receita)}</span>
          <span style={{ fontSize: "0.75rem", color: "var(--mf-texto-sec)" }}>
            Recebido {brl(atual.recebido)} · Falta {brl(atual.aReceber)}
          </span>
          <Barra parte={atual.recebido} total={atual.receita} cor="#16A34A" />
        </div>
        <div className="mf-stat-card">
          <span className="mf-stat-label" style={{ display: "flex", alignItems: "center", gap: 6 }}><ArrowUpCircle size={15} color="#DC2626" />Vai sair (despesas do mês)</span>
          <span className="mf-stat-value" style={{ color: "var(--mf-vermelho)" }}>{brl(atual.despesa)}</span>
          <span style={{ fontSize: "0.75rem", color: "var(--mf-texto-sec)" }}>
            Pago {brl(atual.pago)} · Falta {brl(atual.aPagar)}
          </span>
          <Barra parte={atual.pago} total={atual.despesa} cor="#DC2626" />
        </div>
      </div>

      {/* Últimos 6 meses */}
      <div className="mf-card" style={{ padding: "1rem 1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: 8 }}>
          <strong style={{ fontSize: "0.9375rem" }}>Últimos 6 meses</strong>
          <span style={{ display: "flex", gap: 12, fontSize: "0.75rem", color: "var(--mf-texto-sec)" }}>
            <span><i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#16A34A", marginRight: 4 }} />Entrada</span>
            <span><i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#F87171", marginRight: 4 }} />Saída</span>
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, alignItems: "end", height: 150 }}>
          {historico.map((h) => (
            <button
              key={h.chave}
              onClick={() => setMes(h.chave)}
              title={`${nomeMes(h.chave)} — lucro ${brl(h.lucro)}`}
              style={{ border: "none", background: h.chave === mes ? "var(--mf-laranja-light)" : "transparent", borderRadius: 8, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", padding: "4px 2px" }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: h.lucro >= 0 ? "#15803D" : "#B91C1C", marginBottom: 4, whiteSpace: "nowrap" }}>{h.receita || h.despesa ? brlCurto(h.lucro) : ""}</span>
              <span style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 96 }}>
                <span style={{ width: 12, borderRadius: "4px 4px 0 0", background: "#16A34A", height: `${Math.max(2, (h.receita / maxBarra) * 96)}px` }} />
                <span style={{ width: 12, borderRadius: "4px 4px 0 0", background: "#F87171", height: `${Math.max(2, (h.despesa / maxBarra) * 96)}px` }} />
              </span>
              <span style={{ fontSize: 11, marginTop: 4, color: h.chave === mes ? "var(--mf-laranja)" : "var(--mf-texto-sec)", fontWeight: h.chave === mes ? 700 : 500 }}>{nomeMes(h.chave, true)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Detalhes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
        <div className="mf-card" style={{ padding: "1rem 1.25rem" }}>
          <strong style={{ fontSize: "0.9375rem" }}>Entradas do mês ({atual.entradas.length})</strong>
          {atual.entradas.length === 0 ? (
            <p style={{ fontSize: "0.8125rem", color: "var(--mf-texto-sec)", margin: "0.5rem 0 0" }}>Nenhuma cobrança com vencimento neste mês.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: "0.5rem 0 0" }}>
              {[...atual.entradas].sort((a, b) => b.valor - a.valor).map((e) => (
                <li key={e.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "0.5rem 0", borderBottom: "1px solid var(--mf-borda)", fontSize: "0.8125rem" }}>
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ color: e.pago ? "#16A34A" : e.atrasado ? "#DC2626" : "#CA8A04", marginRight: 6 }}>●</span>{e.titulo}
                  </span>
                  <strong style={{ whiteSpace: "nowrap" }}>{brl(e.valor)}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mf-card" style={{ padding: "1rem 1.25rem" }}>
          <strong style={{ fontSize: "0.9375rem" }}>Saídas por categoria</strong>
          {porCategoria.length === 0 ? (
            <p style={{ fontSize: "0.8125rem", color: "var(--mf-texto-sec)", margin: "0.5rem 0 0" }}>Nenhuma despesa neste mês.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: "0.5rem 0 0" }}>
              {porCategoria.map(([cat, v]) => (
                <li key={cat} style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--mf-borda)", fontSize: "0.8125rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span>{cat}</span><strong>{brl(v)}</strong>
                  </div>
                  <Barra parte={v} total={atual.despesa} cor="#F87171" />
                </li>
              ))}
            </ul>
          )}
          <p style={{ fontSize: "0.6875rem", color: "var(--mf-texto-desab)", margin: "0.75rem 0 0" }}>
            Despesas fixas entram em todo mês a partir do primeiro vencimento. Parceladas entram pelo valor da parcela do mês.
          </p>
        </div>
      </div>
    </div>
  );
}

function Barra({ parte, total, cor }: { parte: number; total: number; cor: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((parte / total) * 100)) : 0;
  return (
    <div style={{ height: 6, borderRadius: 999, background: "var(--mf-fundo)", marginTop: 6, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: cor, borderRadius: 999 }} />
    </div>
  );
}

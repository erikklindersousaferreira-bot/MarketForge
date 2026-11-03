"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase";
import type { Cobranca, Despesa, Cliente } from "@/lib/types";

// ── Ícones ───────────────────────────────────────────────────
function IconPlus() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function IconEdit() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function IconTrash() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}
function IconCheck() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function IconX() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function IconDollar() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
}
function IconTrend() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
}
function IconWallet() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/><circle cx="17" cy="13" r="1"/></svg>;
}
function IconAlert() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}

// ── Helpers ──────────────────────────────────────────────────
function brl(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataFmt(iso: string | null | undefined) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function hoje() {
  return new Date().toISOString().split("T")[0];
}

function addMeses(dataISO: string, meses: number) {
  const d = new Date(dataISO + "T12:00:00");
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().split("T")[0];
}

// ── Badges ───────────────────────────────────────────────────
function StatusCobranca({ status }: { status: Cobranca["status"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    pendente:  { label: "Pendente",  cls: "mf-badge mf-badge-amarelo"  },
    pago:      { label: "Pago",      cls: "mf-badge mf-badge-verde"    },
    atrasado:  { label: "Atrasado",  cls: "mf-badge mf-badge-vermelho" },
    cancelado: { label: "Cancelado", cls: "mf-badge mf-badge-cinza"    },
  };
  const { label, cls } = map[status] ?? map.pendente;
  return <span className={cls}>{label}</span>;
}

function StatusDespesa({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pendente: { label: "Pendente", cls: "mf-badge mf-badge-amarelo"  },
    pago:     { label: "Pago",     cls: "mf-badge mf-badge-verde"    },
    atrasado: { label: "Atrasado", cls: "mf-badge mf-badge-vermelho" },
  };
  const { label, cls } = map[status] ?? map.pendente;
  return <span className={cls}>{label}</span>;
}

function TipoDespesa({ tipo }: { tipo: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    fixa:       { label: "Fixa",       cls: "mf-badge mf-badge-azul"    },
    unica:      { label: "Única",      cls: "mf-badge mf-badge-cinza"   },
    parcelada:  { label: "Parcelada",  cls: "mf-badge mf-badge-roxo"    },
  };
  const { label, cls } = map[tipo] ?? { label: tipo, cls: "mf-badge mf-badge-cinza" };
  return <span className={cls}>{label}</span>;
}

// ── Modal Cobrança ────────────────────────────────────────────
interface ModalCobrancaProps {
  cobranca: Partial<Cobranca> | null;
  clientes: Pick<Cliente, "id" | "nome">[];
  onClose: () => void;
  onSave: () => void;
}

function ModalCobranca({ cobranca, clientes, onClose, onSave }: ModalCobrancaProps) {
  const supabase = createBrowserClient();
  const isEdicao = !!cobranca?.id;

  const [form, setForm] = useState({
    cliente_id:   cobranca?.cliente_id    ?? "",
    descricao:    cobranca?.descricao     ?? "",
    valor:        cobranca?.valor?.toString() ?? "",
    vencimento:   cobranca?.vencimento    ?? hoje(),
    status:       cobranca?.status        ?? "pendente",
    tipo:         cobranca?.tipo          ?? "mensalidade",
    recorrente:   cobranca?.recorrente    ?? false,
    observacoes:  cobranca?.observacoes   ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");

  function set(campo: string, valor: string | boolean) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id) { setErro("Selecione o cliente."); return; }
    if (!form.descricao.trim()) { setErro("Descrição é obrigatória."); return; }
    const valorNum = parseFloat(form.valor.replace(",", "."));
    if (isNaN(valorNum) || valorNum <= 0) { setErro("Valor inválido."); return; }

    setSalvando(true); setErro("");

    const payload = {
      cliente_id:   form.cliente_id,
      descricao:    form.descricao.trim(),
      valor:        valorNum,
      vencimento:   form.vencimento,
      status:       form.status as Cobranca["status"],
      tipo:         form.tipo,
      recorrente:   form.recorrente,
      observacoes:  form.observacoes.trim() || null,
    };

    const { error } = isEdicao
      ? await supabase.from("cobrancas").update(payload).eq("id", cobranca!.id!)
      : await supabase.from("cobrancas").insert(payload);

    if (error) { setErro("Erro ao salvar. Tente novamente."); setSalvando(false); return; }
    onSave();
  }

  return (
    <div className="mf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mf-modal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--mf-borda)" }}>
          <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700 }}>
            {isEdicao ? "Editar cobrança" : "Nova cobrança"}
          </h2>
          <button onClick={onClose} style={{ padding: "0.25rem", border: "none", background: "none", color: "var(--mf-texto-sec)", cursor: "pointer", borderRadius: 4 }}>
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSalvar} style={{ padding: "1.5rem" }}>
          <div style={{ marginBottom: "0.875rem" }}>
            <label className="mf-label">Cliente *</label>
            <select className="mf-input" value={form.cliente_id} onChange={e => set("cliente_id", e.target.value)}>
              <option value="">Selecione...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: "0.875rem" }}>
            <label className="mf-label">Descrição *</label>
            <input type="text" className="mf-input" placeholder="Ex: Mensalidade Outubro/2026" value={form.descricao} onChange={e => set("descricao", e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Valor (R$) *</label>
              <input type="text" className="mf-input" placeholder="0,00" value={form.valor} onChange={e => set("valor", e.target.value)} />
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Vencimento *</label>
              <input type="date" className="mf-input" value={form.vencimento} onChange={e => set("vencimento", e.target.value)} />
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Tipo</label>
              <select className="mf-input" value={form.tipo} onChange={e => set("tipo", e.target.value)}>
                <option value="mensalidade">Mensalidade</option>
                <option value="projeto">Projeto</option>
                <option value="avulso">Avulso</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Status</label>
              <select className="mf-input" value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <input
              type="checkbox"
              id="recorrente-toggle"
              checked={form.recorrente}
              onChange={e => set("recorrente", e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#FF6A00", cursor: "pointer" }}
            />
            <label htmlFor="recorrente-toggle" style={{ fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
              Cobrança recorrente (mensal)
            </label>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="mf-label">Observações</label>
            <textarea className="mf-input" rows={2} placeholder="Anotações opcionais..." value={form.observacoes} onChange={e => set("observacoes", e.target.value)} style={{ resize: "vertical" }} />
          </div>

          {erro && (
            <div style={{ background: "#FEF2F2", color: "var(--mf-vermelho)", border: "1px solid #FECACA", borderRadius: 8, padding: "0.75rem", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {erro}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button type="button" className="mf-btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="mf-btn-primary" disabled={salvando}>
              {salvando ? "Salvando..." : isEdicao ? "Salvar alterações" : "Criar cobrança"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Despesa ─────────────────────────────────────────────
interface ModalDespesaProps {
  despesa: Partial<Despesa> | null;
  onClose: () => void;
  onSave: () => void;
}

function ModalDespesa({ despesa, onClose, onSave }: ModalDespesaProps) {
  const supabase = createBrowserClient();
  const isEdicao = !!despesa?.id;

  const [form, setForm] = useState({
    descricao:    despesa?.descricao    ?? "",
    valor:        despesa?.valor?.toString() ?? "",
    tipo:         despesa?.tipo         ?? "fixa",
    categoria:    despesa?.categoria    ?? "",
    vencimento:   despesa?.vencimento   ?? hoje(),
    num_parcelas: despesa?.num_parcelas?.toString() ?? "2",
    observacoes:  despesa?.observacoes  ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");

  function set(campo: string, valor: string) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.descricao.trim()) { setErro("Descrição é obrigatória."); return; }
    const valorNum = parseFloat(form.valor.replace(",", "."));
    if (isNaN(valorNum) || valorNum <= 0) { setErro("Valor inválido."); return; }

    setSalvando(true); setErro("");

    const numParcelas = form.tipo === "parcelada" ? parseInt(form.num_parcelas) : null;

    const payload = {
      descricao:    form.descricao.trim(),
      valor:        valorNum,
      tipo:         form.tipo as Despesa["tipo"],
      categoria:    form.categoria.trim() || null,
      vencimento:   form.vencimento,
      num_parcelas: numParcelas,
      observacoes:  form.observacoes.trim() || null,
    };

    if (isEdicao) {
      const { error } = await supabase.from("despesas").update(payload).eq("id", despesa!.id!);
      if (error) { setErro("Erro ao salvar."); setSalvando(false); return; }
    } else {
      const { data: novaDespesa, error } = await supabase.from("despesas").insert(payload).select().single();
      if (error || !novaDespesa) { setErro("Erro ao criar despesa."); setSalvando(false); return; }

      // Criar parcelas se parcelada
      if (form.tipo === "parcelada" && numParcelas && numParcelas > 0) {
        const parcelas = Array.from({ length: numParcelas }, (_, i) => ({
          despesa_id:     novaDespesa.id,
          numero_parcela: i + 1,
          valor_parcela:  parseFloat((valorNum / numParcelas).toFixed(2)),
          vencimento:     addMeses(form.vencimento, i),
          status:         "pendente" as const,
        }));
        await supabase.from("parcelas_despesas").insert(parcelas);
      }
    }

    onSave();
  }

  return (
    <div className="mf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mf-modal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--mf-borda)" }}>
          <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700 }}>
            {isEdicao ? "Editar despesa" : "Nova despesa"}
          </h2>
          <button onClick={onClose} style={{ padding: "0.25rem", border: "none", background: "none", color: "var(--mf-texto-sec)", cursor: "pointer", borderRadius: 4 }}>
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSalvar} style={{ padding: "1.5rem" }}>
          <div style={{ marginBottom: "0.875rem" }}>
            <label className="mf-label">Descrição *</label>
            <input type="text" className="mf-input" placeholder="Ex: Aluguel do escritório" value={form.descricao} onChange={e => set("descricao", e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Valor (R$) *</label>
              <input type="text" className="mf-input" placeholder="0,00" value={form.valor} onChange={e => set("valor", e.target.value)} />
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Tipo</label>
              <select className="mf-input" value={form.tipo} onChange={e => set("tipo", e.target.value)}>
                <option value="fixa">Fixa (mensal)</option>
                <option value="unica">Única</option>
                <option value="parcelada">Parcelada</option>
              </select>
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Categoria</label>
              <input type="text" className="mf-input" placeholder="Ex: Aluguel, Salário..." value={form.categoria} onChange={e => set("categoria", e.target.value)} />
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">{form.tipo === "parcelada" ? "1ª Parcela" : "Vencimento"}</label>
              <input type="date" className="mf-input" value={form.vencimento} onChange={e => set("vencimento", e.target.value)} />
            </div>
          </div>

          {form.tipo === "parcelada" && (
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Número de parcelas</label>
              <input type="number" className="mf-input" min="2" max="60" value={form.num_parcelas} onChange={e => set("num_parcelas", e.target.value)} />
              {form.valor && parseInt(form.num_parcelas) > 1 && !isNaN(parseFloat(form.valor.replace(",", "."))) && (
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--mf-texto-sec)" }}>
                  {parseInt(form.num_parcelas)}x de {brl(parseFloat(form.valor.replace(",", ".")) / parseInt(form.num_parcelas))}
                </p>
              )}
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label className="mf-label">Observações</label>
            <textarea className="mf-input" rows={2} placeholder="Anotações opcionais..." value={form.observacoes} onChange={e => set("observacoes", e.target.value)} style={{ resize: "vertical" }} />
          </div>

          {erro && (
            <div style={{ background: "#FEF2F2", color: "var(--mf-vermelho)", border: "1px solid #FECACA", borderRadius: 8, padding: "0.75rem", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {erro}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button type="button" className="mf-btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="mf-btn-primary" disabled={salvando}>
              {salvando ? "Salvando..." : isEdicao ? "Salvar alterações" : "Criar despesa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Aba Cobranças ─────────────────────────────────────────────
function AbaCobrancas({ clientes }: { clientes: Pick<Cliente, "id" | "nome">[] }) {
  const supabase = createBrowserClient();

  const [cobrancas,   setCobrancas]   = useState<Cobranca[]>([]);
  const [carregando,  setCarregando]  = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando,    setEditando]    = useState<Partial<Cobranca> | null>(null);
  const [deletando,   setDeletando]   = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroCliente, setFiltroCliente] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data } = await supabase
      .from("cobrancas")
      .select("*, cliente:cliente_id(id, nome)")
      .order("vencimento", { ascending: true });
    if (data) setCobrancas(data as Cobranca[]);
    setCarregando(false);
  }, [supabase]);

  useEffect(() => { carregar(); }, [carregar]);

  async function handlePago(id: string) {
    await supabase.from("cobrancas").update({ status: "pago", data_pagamento: hoje() }).eq("id", id);
    carregar();
  }

  async function handleDelete(id: string) {
    await supabase.from("cobrancas").delete().eq("id", id);
    setDeletando(null);
    carregar();
  }

  const filtradas = cobrancas.filter(c => {
    const matchStatus  = filtroStatus === "todos" || c.status === filtroStatus;
    const matchCliente = !filtroCliente || c.cliente_id === filtroCliente;
    return matchStatus && matchCliente;
  });

  const totais = {
    todos:     cobrancas.length,
    pendente:  cobrancas.filter(c => c.status === "pendente").length,
    pago:      cobrancas.filter(c => c.status === "pago").length,
    atrasado:  cobrancas.filter(c => c.status === "atrasado").length,
    cancelado: cobrancas.filter(c => c.status === "cancelado").length,
  };

  const totalPendente = cobrancas.filter(c => c.status === "pendente" || c.status === "atrasado").reduce((acc, c) => acc + (c.valor ?? 0), 0);
  const totalRecebido = cobrancas.filter(c => c.status === "pago").reduce((acc, c) => acc + (c.valor ?? 0), 0);

  return (
    <div>
      {/* Resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="mf-stat-card">
          <div className="mf-stat-label">A receber</div>
          <div className="mf-stat-value" style={{ fontSize: "1.375rem", color: "var(--mf-amarelo)" }}>{brl(totalPendente)}</div>
        </div>
        <div className="mf-stat-card">
          <div className="mf-stat-label">Recebido</div>
          <div className="mf-stat-value" style={{ fontSize: "1.375rem", color: "var(--mf-verde)" }}>{brl(totalRecebido)}</div>
        </div>
        <div className="mf-stat-card">
          <div className="mf-stat-label">Atrasadas</div>
          <div className="mf-stat-value" style={{ fontSize: "1.375rem", color: totais.atrasado > 0 ? "var(--mf-vermelho)" : "var(--mf-texto)" }}>{totais.atrasado}</div>
        </div>
      </div>

      {/* Controles */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "0.25rem", background: "var(--mf-fundo)", borderRadius: 8, padding: "0.25rem", border: "1px solid var(--mf-borda)" }}>
            {(["todos", "pendente", "pago", "atrasado", "cancelado"] as const).map(s => (
              <button
                key={s}
                onClick={() => setFiltroStatus(s)}
                style={{
                  padding: "0.3rem 0.6rem", borderRadius: 6, border: "none",
                  fontSize: "0.75rem", fontWeight: 500, cursor: "pointer",
                  background: filtroStatus === s ? "white" : "transparent",
                  color: filtroStatus === s ? "var(--mf-texto)" : "var(--mf-texto-sec)",
                  boxShadow: filtroStatus === s ? "0 1px 3px rgba(0,0,0,.08)" : "none",
                  transition: "all 150ms",
                }}
              >
                {s === "todos" ? `Todos (${totais.todos})` : s.charAt(0).toUpperCase() + s.slice(1) + ` (${totais[s]})`}
              </button>
            ))}
          </div>

          <select className="mf-input" style={{ width: "auto", fontSize: "0.8125rem" }} value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}>
            <option value="">Todos os clientes</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <button className="mf-btn-primary" onClick={() => { setEditando(null); setModalAberto(true); }} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <IconPlus /> Nova cobrança
        </button>
      </div>

      {/* Tabela */}
      <div className="mf-card" style={{ padding: 0, overflow: "hidden" }}>
        {carregando ? (
          <div style={{ padding: "3rem", textAlign: "center" }}><div className="mf-spinner" style={{ margin: "0 auto" }} /></div>
        ) : filtradas.length === 0 ? (
          <div className="mf-empty">
            <div className="mf-empty-icon">💰</div>
            <div className="mf-empty-title">Nenhuma cobrança encontrada</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="mf-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th style={{ width: 100, textAlign: "center" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                      {(c.cliente as unknown as { nome: string } | null)?.nome ?? "—"}
                    </td>
                    <td style={{ fontSize: "0.875rem" }}>
                      <div>{c.descricao}</div>
                      {c.recorrente && <div style={{ fontSize: "0.75rem", color: "var(--mf-azul)" }}>↻ Recorrente</div>}
                    </td>
                    <td style={{ fontSize: "0.875rem", fontWeight: 600, color: c.status === "pago" ? "var(--mf-verde)" : "var(--mf-texto)" }}>
                      {brl(c.valor)}
                    </td>
                    <td style={{ fontSize: "0.875rem", color: c.status === "atrasado" ? "var(--mf-vermelho)" : "var(--mf-texto-sec)" }}>
                      {dataFmt(c.vencimento)}
                    </td>
                    <td style={{ fontSize: "0.75rem", color: "var(--mf-texto-sec)", textTransform: "capitalize" }}>{c.tipo}</td>
                    <td><StatusCobranca status={c.status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                        {(c.status === "pendente" || c.status === "atrasado") && (
                          <button
                            style={{ padding: "0.3rem", border: "none", background: "none", color: "var(--mf-verde)", cursor: "pointer", borderRadius: 4 }}
                            onClick={() => handlePago(c.id)} title="Marcar como pago"
                          >
                            <IconCheck />
                          </button>
                        )}
                        <button
                          style={{ padding: "0.3rem", border: "none", background: "none", color: "var(--mf-texto-sec)", cursor: "pointer", borderRadius: 4 }}
                          onClick={() => { setEditando(c); setModalAberto(true); }} title="Editar"
                        >
                          <IconEdit />
                        </button>
                        <button
                          style={{ padding: "0.3rem", border: "none", background: "none", color: "var(--mf-vermelho)", cursor: "pointer", borderRadius: 4 }}
                          onClick={() => setDeletando(c.id)} title="Excluir"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal cobrança */}
      {modalAberto && (
        <ModalCobranca
          cobranca={editando}
          clientes={clientes}
          onClose={() => { setModalAberto(false); setEditando(null); }}
          onSave={() => { setModalAberto(false); setEditando(null); carregar(); }}
        />
      )}

      {/* Confirmação exclusão */}
      {deletando && (
        <div className="mf-overlay">
          <div className="mf-modal" style={{ maxWidth: 400 }}>
            <div style={{ padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 700 }}>Excluir cobrança?</h3>
              <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "var(--mf-texto-sec)" }}>Esta ação não pode ser desfeita.</p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button className="mf-btn-secondary" onClick={() => setDeletando(null)}>Cancelar</button>
                <button className="mf-btn-primary" style={{ background: "var(--mf-vermelho)" }} onClick={() => handleDelete(deletando)}>Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Aba Despesas ──────────────────────────────────────────────
function AbaDespesas() {
  const supabase = createBrowserClient();

  const [despesas,    setDespesas]    = useState<Despesa[]>([]);
  const [carregando,  setCarregando]  = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando,    setEditando]    = useState<Partial<Despesa> | null>(null);
  const [deletando,   setDeletando]   = useState<string | null>(null);
  const [filtroTipo,  setFiltroTipo]  = useState("todos");

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data } = await supabase
      .from("despesas")
      .select("*, parcelas:parcelas_despesas(*)")
      .order("vencimento", { ascending: true });
    if (data) setDespesas(data as Despesa[]);
    setCarregando(false);
  }, [supabase]);

  useEffect(() => { carregar(); }, [carregar]);

  async function handleDelete(id: string) {
    await supabase.from("despesas").delete().eq("id", id);
    setDeletando(null);
    carregar();
  }

  async function handlePagarParcela(parcelaId: string) {
    await supabase.from("parcelas_despesas").update({ status: "pago", data_pagamento: hoje() }).eq("id", parcelaId);
    carregar();
  }

  const filtradas = despesas.filter(d =>
    filtroTipo === "todos" || d.tipo === filtroTipo
  );

  const totalDespesas = despesas.reduce((acc, d) => acc + (d.valor ?? 0), 0);
  const totalPago = despesas
    .filter(d => {
      if (d.tipo === "parcelada") {
        const parcelas = (d as Despesa & { parcelas?: Array<{ status: string; valor_parcela: number }> }).parcelas ?? [];
        return parcelas.every(p => p.status === "pago");
      }
      return d.status === "pago";
    })
    .reduce((acc, d) => acc + (d.valor ?? 0), 0);

  return (
    <div>
      {/* Resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="mf-stat-card">
          <div className="mf-stat-label">Total despesas</div>
          <div className="mf-stat-value" style={{ fontSize: "1.375rem" }}>{brl(totalDespesas)}</div>
        </div>
        <div className="mf-stat-card">
          <div className="mf-stat-label">Já pago</div>
          <div className="mf-stat-value" style={{ fontSize: "1.375rem", color: "var(--mf-verde)" }}>{brl(totalPago)}</div>
        </div>
        <div className="mf-stat-card">
          <div className="mf-stat-label">A pagar</div>
          <div className="mf-stat-value" style={{ fontSize: "1.375rem", color: "var(--mf-vermelho)" }}>{brl(totalDespesas - totalPago)}</div>
        </div>
      </div>

      {/* Controles */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.25rem", background: "var(--mf-fundo)", borderRadius: 8, padding: "0.25rem", border: "1px solid var(--mf-borda)" }}>
          {(["todos", "fixa", "unica", "parcelada"] as const).map(t => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              style={{
                padding: "0.3rem 0.6rem", borderRadius: 6, border: "none",
                fontSize: "0.75rem", fontWeight: 500, cursor: "pointer",
                background: filtroTipo === t ? "white" : "transparent",
                color: filtroTipo === t ? "var(--mf-texto)" : "var(--mf-texto-sec)",
                boxShadow: filtroTipo === t ? "0 1px 3px rgba(0,0,0,.08)" : "none",
                transition: "all 150ms",
              }}
            >
              {t === "todos" ? "Todos" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <button className="mf-btn-primary" onClick={() => { setEditando(null); setModalAberto(true); }} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <IconPlus /> Nova despesa
        </button>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {carregando ? (
          <div style={{ padding: "3rem", textAlign: "center" }}><div className="mf-spinner" style={{ margin: "0 auto" }} /></div>
        ) : filtradas.length === 0 ? (
          <div className="mf-card">
            <div className="mf-empty">
              <div className="mf-empty-icon">📋</div>
              <div className="mf-empty-title">Nenhuma despesa cadastrada</div>
            </div>
          </div>
        ) : (
          filtradas.map(d => {
            const parcelas = (d as Despesa & { parcelas?: Array<{ id: string; numero_parcela: number; valor_parcela: number; vencimento: string; status: string }> }).parcelas ?? [];
            const parcelasPagas = parcelas.filter(p => p.status === "pago").length;
            return (
              <div key={d.id} className="mf-card" style={{ padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{d.descricao}</span>
                      <TipoDespesa tipo={d.tipo} />
                      {d.tipo !== "parcelada" && <StatusDespesa status={d.status} />}
                      {d.categoria && (
                        <span style={{ fontSize: "0.75rem", color: "var(--mf-texto-sec)", background: "var(--mf-fundo)", padding: "0.125rem 0.5rem", borderRadius: 999, border: "1px solid var(--mf-borda)" }}>
                          {d.categoria}
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: "0.375rem", fontSize: "0.875rem", color: "var(--mf-texto-sec)" }}>
                      {d.tipo === "parcelada"
                        ? `${parcelasPagas}/${parcelas.length} parcelas pagas · Total: ${brl(d.valor)}`
                        : `${brl(d.valor)} · Venc. ${dataFmt(d.vencimento)}`
                      }
                    </div>

                    {/* Parcelas */}
                    {d.tipo === "parcelada" && parcelas.length > 0 && (
                      <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                        {parcelas.map(p => (
                          <button
                            key={p.id}
                            onClick={() => p.status !== "pago" && handlePagarParcela(p.id)}
                            style={{
                              padding: "0.25rem 0.625rem",
                              borderRadius: 6,
                              border: "1px solid",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              cursor: p.status === "pago" ? "default" : "pointer",
                              background: p.status === "pago" ? "var(--mf-verde-bg)" : "white",
                              borderColor: p.status === "pago" ? "var(--mf-verde)" : "var(--mf-borda)",
                              color: p.status === "pago" ? "var(--mf-verde)" : "var(--mf-texto-sec)",
                              transition: "all 150ms",
                            }}
                            title={p.status !== "pago" ? `Marcar parcela ${p.numero_parcela} como paga` : undefined}
                          >
                            {p.numero_parcela}/{parcelas.length} · {brl(p.valor_parcela)}
                            {p.status === "pago" && " ✓"}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
                    {d.tipo !== "parcelada" && d.status !== "pago" && (
                      <button
                        style={{ padding: "0.375rem", border: "none", background: "none", color: "var(--mf-verde)", cursor: "pointer", borderRadius: 4 }}
                        onClick={async () => { await supabase.from("despesas").update({ status: "pago", data_pagamento: hoje() }).eq("id", d.id); carregar(); }}
                        title="Marcar como pago"
                      >
                        <IconCheck />
                      </button>
                    )}
                    <button
                      style={{ padding: "0.375rem", border: "none", background: "none", color: "var(--mf-texto-sec)", cursor: "pointer", borderRadius: 4 }}
                      onClick={() => { setEditando(d); setModalAberto(true); }} title="Editar"
                    >
                      <IconEdit />
                    </button>
                    <button
                      style={{ padding: "0.375rem", border: "none", background: "none", color: "var(--mf-vermelho)", cursor: "pointer", borderRadius: 4 }}
                      onClick={() => setDeletando(d.id)} title="Excluir"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal despesa */}
      {modalAberto && (
        <ModalDespesa
          despesa={editando}
          onClose={() => { setModalAberto(false); setEditando(null); }}
          onSave={() => { setModalAberto(false); setEditando(null); carregar(); }}
        />
      )}

      {/* Confirmação exclusão */}
      {deletando && (
        <div className="mf-overlay">
          <div className="mf-modal" style={{ maxWidth: 400 }}>
            <div style={{ padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 700 }}>Excluir despesa?</h3>
              <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "var(--mf-texto-sec)" }}>As parcelas vinculadas também serão removidas.</p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button className="mf-btn-secondary" onClick={() => setDeletando(null)}>Cancelar</button>
                <button className="mf-btn-primary" style={{ background: "var(--mf-vermelho)" }} onClick={() => handleDelete(deletando)}>Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────
export default function FinanceiroPage() {
  const supabase = createBrowserClient();
  const [aba,     setAba]     = useState<"cobrancas" | "despesas">("cobrancas");
  const [clientes, setClientes] = useState<Pick<Cliente, "id" | "nome">[]>([]);

  useEffect(() => {
    supabase.from("clientes").select("id, nome").eq("status", "ativo").order("nome")
      .then(({ data }) => { if (data) setClientes(data); });
  }, [supabase]);

  const abas = [
    { key: "cobrancas", label: "Cobranças",  icon: <IconDollar /> },
    { key: "despesas",  label: "Despesas",   icon: <IconWallet /> },
  ] as const;

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mf-page-header" style={{ marginBottom: "1rem" }}>
        <div>
          <h1 className="mf-page-title">Financeiro</h1>
          <p className="mf-page-subtitle">Cobranças de clientes e despesas da agência</p>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: "0.25rem", background: "white", borderRadius: 10, padding: "0.25rem", border: "1px solid var(--mf-borda)", marginBottom: "1.5rem", width: "fit-content", boxShadow: "var(--shadow-sm)" }}>
        {abas.map(a => (
          <button
            key={a.key}
            onClick={() => setAba(a.key)}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1rem", borderRadius: 7, border: "none",
              fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
              background: aba === a.key ? "var(--mf-laranja)" : "transparent",
              color:      aba === a.key ? "white" : "var(--mf-texto-sec)",
              transition: "all 150ms",
            }}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {aba === "cobrancas" && <AbaCobrancas clientes={clientes} />}
      {aba === "despesas"  && <AbaDespesas />}
    </div>
  );
}

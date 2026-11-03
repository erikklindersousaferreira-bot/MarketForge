"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase";
import type { Cliente, Usuario } from "@/lib/types";

// ── Ícones ───────────────────────────────────────────────────
function IconPlus() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function IconSearch() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function IconEdit() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function IconTrash() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}
function IconX() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}

// ── Status badge ─────────────────────────────────────────────
function StatusBadge({ status }: { status: Cliente["status"] }) {
  const map: Record<Cliente["status"], { label: string; cls: string }> = {
    ativo:     { label: "Ativo",     cls: "mf-badge mf-badge-verde" },
    inativo:   { label: "Inativo",   cls: "mf-badge mf-badge-cinza" },
    prospecto: { label: "Prospecto", cls: "mf-badge mf-badge-azul"  },
  };
  const { label, cls } = map[status];
  return <span className={cls}>{label}</span>;
}

// ── Avatar ────────────────────────────────────────────────────
function ClienteAvatar({ nome, logo }: { nome: string; logo?: string | null }) {
  if (logo) {
    return <img src={logo} alt={nome} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />;
  }
  const initials = nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 8, background: "#FF6A00", color: "white",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: "0.8125rem", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── Modal cadastro/edição ─────────────────────────────────────
interface ModalProps {
  cliente: Partial<Cliente> | null;
  responsaveis: Pick<Usuario, "id" | "nome">[];
  onClose: () => void;
  onSave: () => void;
}

function ModalCliente({ cliente, responsaveis, onClose, onSave }: ModalProps) {
  const supabase = createBrowserClient();
  const isEdicao = !!cliente?.id;

  const [form, setForm] = useState({
    nome:        cliente?.nome        ?? "",
    email:       cliente?.email       ?? "",
    telefone:    cliente?.telefone    ?? "",
    cnpj_cpf:    cliente?.cnpj_cpf    ?? "",
    segmento:    cliente?.segmento    ?? "",
    status:      cliente?.status      ?? "ativo",
    responsavel_id: cliente?.responsavel_id ?? "",
    observacoes: cliente?.observacoes ?? "",
  });
  const [salvando, setSalvando]   = useState(false);
  const [erro, setErro]           = useState("");

  function set(campo: string, valor: string) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) { setErro("Nome é obrigatório."); return; }
    setSalvando(true); setErro("");

    const payload = {
      nome:           form.nome.trim(),
      email:          form.email.trim()    || null,
      telefone:       form.telefone.trim() || null,
      cnpj_cpf:       form.cnpj_cpf.trim() || null,
      segmento:       form.segmento.trim() || null,
      status:         form.status as Cliente["status"],
      responsavel_id: form.responsavel_id  || null,
      observacoes:    form.observacoes.trim() || null,
    };

    const { error } = isEdicao
      ? await supabase.from("clientes").update(payload).eq("id", cliente!.id!)
      : await supabase.from("clientes").insert(payload);

    if (error) { setErro("Erro ao salvar. Tente novamente."); setSalvando(false); return; }
    onSave();
  }

  const InputField = ({ label, campo, type = "text", placeholder = "" }: { label: string; campo: string; type?: string; placeholder?: string }) => (
    <div style={{ marginBottom: "0.875rem" }}>
      <label className="mf-label">{label}</label>
      <input
        type={type}
        className="mf-input"
        placeholder={placeholder}
        value={(form as Record<string, string>)[campo]}
        onChange={e => set(campo, e.target.value)}
      />
    </div>
  );

  return (
    <div className="mf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mf-modal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--mf-borda)" }}>
          <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700 }}>
            {isEdicao ? "Editar cliente" : "Novo cliente"}
          </h2>
          <button onClick={onClose} style={{ padding: "0.25rem", border: "none", background: "none", color: "var(--mf-texto-sec)", cursor: "pointer", borderRadius: 4 }}>
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSalvar} style={{ padding: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <InputField label="Nome *" campo="nome" placeholder="Nome do cliente ou empresa" />
            </div>
            <InputField label="E-mail" campo="email" type="email" placeholder="email@cliente.com" />
            <InputField label="Telefone" campo="telefone" type="tel" placeholder="(91) 99999-9999" />
            <InputField label="CNPJ / CPF" campo="cnpj_cpf" placeholder="00.000.000/0001-00" />
            <InputField label="Segmento" campo="segmento" placeholder="Ex: Restaurante, Moda..." />
          </div>

          <div style={{ marginBottom: "0.875rem" }}>
            <label className="mf-label">Status</label>
            <select className="mf-input" value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="prospecto">Prospecto</option>
            </select>
          </div>

          <div style={{ marginBottom: "0.875rem" }}>
            <label className="mf-label">Responsável</label>
            <select className="mf-input" value={form.responsavel_id} onChange={e => set("responsavel_id", e.target.value)}>
              <option value="">Sem responsável</option>
              {responsaveis.map(r => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="mf-label">Observações</label>
            <textarea
              className="mf-input"
              rows={3}
              placeholder="Anotações sobre o cliente..."
              value={form.observacoes}
              onChange={e => set("observacoes", e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          {erro && (
            <div style={{ background: "#FEF2F2", color: "var(--mf-vermelho)", borderRadius: 8, padding: "0.75rem", fontSize: "0.875rem", marginBottom: "1rem", border: "1px solid #FECACA" }}>
              {erro}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button type="button" className="mf-btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="mf-btn-primary" disabled={salvando}>
              {salvando ? "Salvando..." : isEdicao ? "Salvar alterações" : "Criar cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────
export default function ClientesPage() {
  const supabase = createBrowserClient();

  const [clientes,      setClientes]      = useState<Cliente[]>([]);
  const [responsaveis,  setResponsaveis]  = useState<Pick<Usuario, "id" | "nome">[]>([]);
  const [busca,         setBusca]         = useState("");
  const [filtroStatus,  setFiltroStatus]  = useState("todos");
  const [carregando,    setCarregando]    = useState(true);
  const [modalAberto,   setModalAberto]   = useState(false);
  const [editando,      setEditando]      = useState<Partial<Cliente> | null>(null);
  const [deletando,     setDeletando]     = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data } = await supabase
      .from("clientes")
      .select("*, responsavel:responsavel_id(id, nome)")
      .order("nome");
    if (data) setClientes(data as Cliente[]);
    setCarregando(false);
  }, [supabase]);

  useEffect(() => {
    carregar();
    supabase.from("usuarios").select("id, nome").in("papel", ["admin", "equipe"]).eq("ativo", true).order("nome")
      .then(({ data }) => { if (data) setResponsaveis(data); });
  }, [carregar, supabase]);

  async function handleDelete(id: string) {
    await supabase.from("clientes").delete().eq("id", id);
    setDeletando(null);
    carregar();
  }

  function abrirNovo() { setEditando(null); setModalAberto(true); }
  function abrirEdicao(c: Cliente) { setEditando(c); setModalAberto(true); }
  function fecharModal() { setModalAberto(false); setEditando(null); }

  const filtrados = clientes.filter(c => {
    const matchBusca = !busca
      || c.nome.toLowerCase().includes(busca.toLowerCase())
      || (c.email ?? "").toLowerCase().includes(busca.toLowerCase())
      || (c.segmento ?? "").toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === "todos" || c.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const contagem = {
    todos:     clientes.length,
    ativo:     clientes.filter(c => c.status === "ativo").length,
    inativo:   clientes.filter(c => c.status === "inativo").length,
    prospecto: clientes.filter(c => c.status === "prospecto").length,
  };

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mf-page-header">
        <div>
          <h1 className="mf-page-title">Clientes</h1>
          <p className="mf-page-subtitle">{contagem.ativo} ativo{contagem.ativo !== 1 ? "s" : ""} · {contagem.prospecto} prospecto{contagem.prospecto !== 1 ? "s" : ""}</p>
        </div>
        <button className="mf-btn-primary" onClick={abrirNovo} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <IconPlus /> Novo cliente
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
          <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--mf-texto-sec)", pointerEvents: "none" }}>
            <IconSearch />
          </span>
          <input
            type="text"
            className="mf-input"
            placeholder="Buscar por nome, e-mail ou segmento..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.25rem", background: "var(--mf-fundo)", borderRadius: 8, padding: "0.25rem", border: "1px solid var(--mf-borda)" }}>
          {(["todos", "ativo", "inativo", "prospecto"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              style={{
                padding: "0.375rem 0.75rem", borderRadius: 6, border: "none",
                fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer",
                background: filtroStatus === s ? "white" : "transparent",
                color: filtroStatus === s ? "var(--mf-texto)" : "var(--mf-texto-sec)",
                boxShadow: filtroStatus === s ? "0 1px 3px rgba(0,0,0,.08)" : "none",
                transition: "all 150ms", textTransform: "capitalize",
              }}
            >
              {s === "todos" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)} ({contagem[s]})
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="mf-card" style={{ padding: 0, overflow: "hidden" }}>
        {carregando ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <div className="mf-spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="mf-empty">
            <div className="mf-empty-icon">👥</div>
            <div className="mf-empty-title">
              {busca || filtroStatus !== "todos" ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
            </div>
            <p style={{ fontSize: "0.875rem", margin: "0.25rem 0 1rem", color: "var(--mf-texto-sec)" }}>
              {busca || filtroStatus !== "todos"
                ? "Tente ajustar os filtros de busca."
                : "Cadastre o primeiro cliente da agência."}
            </p>
            {!busca && filtroStatus === "todos" && (
              <button className="mf-btn-primary" onClick={abrirNovo} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                <IconPlus /> Novo cliente
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="mf-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Segmento</th>
                  <th>Contato</th>
                  <th>Responsável</th>
                  <th>Status</th>
                  <th style={{ width: 80, textAlign: "center" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <ClienteAvatar nome={c.nome} logo={c.logo_url} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{c.nome}</div>
                          {c.cnpj_cpf && <div style={{ fontSize: "0.75rem", color: "var(--mf-texto-sec)" }}>{c.cnpj_cpf}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--mf-texto-sec)", fontSize: "0.875rem" }}>{c.segmento ?? "—"}</td>
                    <td>
                      <div style={{ fontSize: "0.875rem" }}>
                        {c.email && <div>{c.email}</div>}
                        {c.telefone && <div style={{ color: "var(--mf-texto-sec)", fontSize: "0.8125rem" }}>{c.telefone}</div>}
                        {!c.email && !c.telefone && <span style={{ color: "var(--mf-texto-desab)" }}>—</span>}
                      </div>
                    </td>
                    <td style={{ fontSize: "0.875rem", color: "var(--mf-texto-sec)" }}>
                      {(c.responsavel as unknown as { nome: string } | null)?.nome ?? "—"}
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                        <button
                          style={{ padding: "0.375rem", border: "none", background: "none", color: "var(--mf-texto-sec)", cursor: "pointer", borderRadius: 4 }}
                          onClick={() => abrirEdicao(c)} title="Editar"
                        >
                          <IconEdit />
                        </button>
                        <button
                          style={{ padding: "0.375rem", border: "none", background: "none", color: "var(--mf-vermelho)", cursor: "pointer", borderRadius: 4 }}
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

      {/* Modal */}
      {modalAberto && (
        <ModalCliente
          cliente={editando}
          responsaveis={responsaveis}
          onClose={fecharModal}
          onSave={() => { fecharModal(); carregar(); }}
        />
      )}

      {/* Confirmação exclusão */}
      {deletando && (
        <div className="mf-overlay">
          <div className="mf-modal" style={{ maxWidth: 400 }}>
            <div style={{ padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 700 }}>Excluir cliente?</h3>
              <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "var(--mf-texto-sec)" }}>
                Esta ação é irreversível. Todos os dados vinculados a este cliente serão removidos.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button className="mf-btn-secondary" onClick={() => setDeletando(null)}>Cancelar</button>
                <button
                  className="mf-btn-primary"
                  style={{ background: "var(--mf-vermelho)", borderColor: "var(--mf-vermelho)" }}
                  onClick={() => handleDelete(deletando)}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

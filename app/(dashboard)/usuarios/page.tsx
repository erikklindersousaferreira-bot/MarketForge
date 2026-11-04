"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Usuario, Cliente } from "@/lib/types";

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
function IconUserCheck() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>;
}
function IconUserX() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="11" x2="23" y2="17"/><line x1="23" y1="11" x2="17" y2="17"/></svg>;
}
function IconX() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function IconMail() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}

// ── Papel badge ──────────────────────────────────────────────
type Papel = "admin" | "equipe" | "cliente";

function PapelBadge({ papel }: { papel: Papel }) {
  const map: Record<Papel, { label: string; cls: string }> = {
    admin:    { label: "Admin",    cls: "mf-badge mf-badge-laranja" },
    equipe:   { label: "Equipe",   cls: "mf-badge mf-badge-azul"    },
    cliente:  { label: "Cliente",  cls: "mf-badge mf-badge-roxo"    },
  };
  const { label, cls } = map[papel];
  return <span className={cls}>{label}</span>;
}

// ── Avatar ────────────────────────────────────────────────────
function UsuarioAvatar({ nome, foto }: { nome: string; foto?: string | null }) {
  if (foto) {
    return <img src={foto} alt={nome} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />;
  }
  const initials = nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%", background: "#FF6A00", color: "white",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: "0.8125rem", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── Modal novo usuário ────────────────────────────────────────
interface ModalNovoProps {
  clientes: Pick<Cliente, "id" | "nome">[];
  onClose: () => void;
  onSave: () => void;
}

function ModalNovoUsuario({ clientes, onClose, onSave }: ModalNovoProps) {
  const [form, setForm] = useState({ nome: "", email: "", papel: "equipe" as Papel, cliente_id: "" });
  const [salvando,  setSalvando]  = useState(false);
  const [erro,      setErro]      = useState("");
  const [sucesso,   setSucesso]   = useState("");

  function set(campo: string, valor: string) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim()) { setErro("Nome e e-mail são obrigatórios."); return; }
    if (form.papel === "cliente" && !form.cliente_id) { setErro("Selecione o cliente vinculado."); return; }

    setSalvando(true); setErro("");

    const res = await fetch("/api/usuarios/criar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome:       form.nome.trim(),
        email:      form.email.trim(),
        papel:      form.papel,
        cliente_id: form.cliente_id || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErro(data.error ?? "Erro ao criar usuário.");
      setSalvando(false);
      return;
    }

    if (data.aviso) {
      setSucesso(data.aviso);
    } else {
      setSucesso("Usuário criado! Um link de acesso foi enviado para o e-mail informado.");
    }
    setSalvando(false);
    setTimeout(() => { onSave(); onClose(); }, 2500);
  }

  return (
    <div className="mf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mf-modal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--mf-borda)" }}>
          <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700 }}>Novo usuário</h2>
          <button onClick={onClose} style={{ padding: "0.25rem", border: "none", background: "none", color: "var(--mf-texto-sec)", cursor: "pointer", borderRadius: 4 }}>
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSalvar} style={{ padding: "1.5rem" }}>
          {sucesso ? (
            <div style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0", borderRadius: 8, padding: "1rem", fontSize: "0.875rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <IconMail />
              <span>{sucesso}</span>
            </div>
          ) : (
            <>
              <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "0.875rem", fontSize: "0.8125rem", color: "#92400E", marginBottom: "1.25rem" }}>
                🔒 O usuário receberá um link por e-mail para definir sua senha no primeiro acesso.
              </div>

              <div style={{ marginBottom: "0.875rem" }}>
                <label className="mf-label">Nome completo *</label>
                <input type="text" className="mf-input" placeholder="Nome do usuário" value={form.nome} onChange={e => set("nome", e.target.value)} />
              </div>

              <div style={{ marginBottom: "0.875rem" }}>
                <label className="mf-label">E-mail *</label>
                <input type="email" className="mf-input" placeholder="email@exemplo.com" value={form.email} onChange={e => set("email", e.target.value)} />
              </div>

              <div style={{ marginBottom: "0.875rem" }}>
                <label className="mf-label">Papel</label>
                <select className="mf-input" value={form.papel} onChange={e => set("papel", e.target.value)}>
                  <option value="admin">Admin — acesso total</option>
                  <option value="equipe">Equipe — operacional</option>
                  <option value="cliente">Cliente — portal próprio</option>
                </select>
              </div>

              {form.papel === "cliente" && (
                <div style={{ marginBottom: "0.875rem" }}>
                  <label className="mf-label">Cliente vinculado *</label>
                  <select className="mf-input" value={form.cliente_id} onChange={e => set("cliente_id", e.target.value)}>
                    <option value="">Selecione...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
              )}

              {erro && (
                <div style={{ background: "#FEF2F2", color: "var(--mf-vermelho)", border: "1px solid #FECACA", borderRadius: 8, padding: "0.75rem", fontSize: "0.875rem", marginBottom: "1rem" }}>
                  {erro}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button type="button" className="mf-btn-secondary" onClick={onClose}>Cancelar</button>
                <button type="submit" className="mf-btn-primary" disabled={salvando}>
                  {salvando ? "Criando..." : "Criar e enviar convite"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

// ── Modal edição ──────────────────────────────────────────────
interface ModalEditarProps {
  usuario: Usuario;
  clientes: Pick<Cliente, "id" | "nome">[];
  onClose: () => void;
  onSave: () => void;
}

function ModalEditarUsuario({ usuario, clientes, onClose, onSave }: ModalEditarProps) {
  const [form, setForm] = useState({
    nome:       usuario.nome,
    papel:      usuario.papel as Papel,
    cliente_id: usuario.cliente_id ?? "",
    ativo:      usuario.ativo,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro,     setErro]     = useState("");

  function set(campo: string, valor: string | boolean) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) { setErro("Nome é obrigatório."); return; }
    setSalvando(true); setErro("");

    const { error } = await supabase
      .from("usuarios")
      .update({
        nome:       form.nome.trim(),
        papel:      form.papel,
        cliente_id: form.papel === "cliente" ? (form.cliente_id || null) : null,
        ativo:      form.ativo,
      })
      .eq("id", usuario.id);

    if (error) { setErro("Erro ao salvar. Tente novamente."); setSalvando(false); return; }
    onSave();
  }

  return (
    <div className="mf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mf-modal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--mf-borda)" }}>
          <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700 }}>Editar usuário</h2>
          <button onClick={onClose} style={{ padding: "0.25rem", border: "none", background: "none", color: "var(--mf-texto-sec)", cursor: "pointer", borderRadius: 4 }}>
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSalvar} style={{ padding: "1.5rem" }}>
          <div style={{ marginBottom: "0.875rem" }}>
            <label className="mf-label">Nome completo *</label>
            <input type="text" className="mf-input" value={form.nome} onChange={e => set("nome", e.target.value)} />
          </div>

          <div style={{ marginBottom: "0.875rem" }}>
            <label className="mf-label">E-mail</label>
            <input type="email" className="mf-input" value={usuario.email} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--mf-texto-sec)" }}>O e-mail não pode ser alterado aqui.</p>
          </div>

          <div style={{ marginBottom: "0.875rem" }}>
            <label className="mf-label">Papel</label>
            <select className="mf-input" value={form.papel} onChange={e => set("papel", e.target.value)}>
              <option value="admin">Admin — acesso total</option>
              <option value="equipe">Equipe — operacional</option>
              <option value="cliente">Cliente — portal próprio</option>
            </select>
          </div>

          {form.papel === "cliente" && (
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Cliente vinculado</label>
              <select className="mf-input" value={form.cliente_id} onChange={e => set("cliente_id", e.target.value)}>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          )}

          <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <input
              type="checkbox"
              id="ativo-toggle"
              checked={form.ativo}
              onChange={e => set("ativo", e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#FF6A00", cursor: "pointer" }}
            />
            <label htmlFor="ativo-toggle" style={{ fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
              Usuário ativo
            </label>
          </div>

          {erro && (
            <div style={{ background: "#FEF2F2", color: "var(--mf-vermelho)", border: "1px solid #FECACA", borderRadius: 8, padding: "0.75rem", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {erro}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button type="button" className="mf-btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="mf-btn-primary" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────
export default function UsuariosPage() {

  const [usuarios,    setUsuarios]    = useState<Usuario[]>([]);
  const [clientes,    setClientes]    = useState<Pick<Cliente, "id" | "nome">[]>([]);
  const [busca,       setBusca]       = useState("");
  const [filtroPapel, setFiltroPapel] = useState("todos");
  const [carregando,  setCarregando]  = useState(true);
  const [modalNovo,   setModalNovo]   = useState(false);
  const [editando,    setEditando]    = useState<Usuario | null>(null);
  const [papelAtual,  setPapelAtual]  = useState<Papel | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data } = await supabase
      .from("usuarios")
      .select("*, cliente:cliente_id(id, nome)")
      .order("nome");
    if (data) setUsuarios(data as Usuario[]);
    setCarregando(false);
  }, [supabase]);

  useEffect(() => {
    carregar();
    supabase.from("clientes").select("id, nome").eq("status", "ativo").order("nome")
      .then(({ data }) => { if (data) setClientes(data); });
    // Papel do usuário logado
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: u } = await supabase.from("usuarios").select("papel").eq("id", data.user.id).single();
        if (u) setPapelAtual(u.papel as Papel);
      }
    });
  }, [carregar, supabase]);

  async function handleToggleAtivo(u: Usuario) {
    await supabase.from("usuarios").update({ ativo: !u.ativo }).eq("id", u.id);
    carregar();
  }

  const filtrados = usuarios.filter(u => {
    const matchBusca = !busca
      || u.nome.toLowerCase().includes(busca.toLowerCase())
      || u.email.toLowerCase().includes(busca.toLowerCase());
    const matchPapel = filtroPapel === "todos" || u.papel === filtroPapel;
    return matchBusca && matchPapel;
  });

  const contagem = {
    todos:   usuarios.length,
    admin:   usuarios.filter(u => u.papel === "admin").length,
    equipe:  usuarios.filter(u => u.papel === "equipe").length,
    cliente: usuarios.filter(u => u.papel === "cliente").length,
  };

  const isAdmin = papelAtual === "admin";

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mf-page-header">
        <div>
          <h1 className="mf-page-title">Usuários e Acessos</h1>
          <p className="mf-page-subtitle">{contagem.todos} usuário{contagem.todos !== 1 ? "s" : ""} cadastrado{contagem.todos !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && (
          <button className="mf-btn-primary" onClick={() => setModalNovo(true)} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <IconPlus /> Novo usuário
          </button>
        )}
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
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.25rem", background: "var(--mf-fundo)", borderRadius: 8, padding: "0.25rem", border: "1px solid var(--mf-borda)" }}>
          {(["todos", "admin", "equipe", "cliente"] as const).map(p => (
            <button
              key={p}
              onClick={() => setFiltroPapel(p)}
              style={{
                padding: "0.375rem 0.75rem", borderRadius: 6, border: "none",
                fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer",
                background: filtroPapel === p ? "white" : "transparent",
                color: filtroPapel === p ? "var(--mf-texto)" : "var(--mf-texto-sec)",
                boxShadow: filtroPapel === p ? "0 1px 3px rgba(0,0,0,.08)" : "none",
                transition: "all 150ms",
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)} ({contagem[p]})
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
            <div className="mf-empty-icon">👤</div>
            <div className="mf-empty-title">
              {busca || filtroPapel !== "todos" ? "Nenhum usuário encontrado" : "Nenhum usuário ainda"}
            </div>
            <p style={{ fontSize: "0.875rem", margin: "0.25rem 0 1rem", color: "var(--mf-texto-sec)" }}>
              {busca || filtroPapel !== "todos" ? "Tente ajustar os filtros." : "Crie o primeiro usuário da equipe."}
            </p>
            {!busca && filtroPapel === "todos" && isAdmin && (
              <button className="mf-btn-primary" onClick={() => setModalNovo(true)} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                <IconPlus /> Novo usuário
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="mf-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>E-mail</th>
                  <th>Papel</th>
                  <th>Vinculado a</th>
                  <th>Status</th>
                  {isAdmin && <th style={{ width: 100, textAlign: "center" }}>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(u => (
                  <tr key={u.id} style={{ opacity: u.ativo ? 1 : 0.55 }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <UsuarioAvatar nome={u.nome} foto={u.foto_url} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{u.nome}</div>
                          {u.primeiro_acesso && (
                            <div style={{ fontSize: "0.75rem", color: "#CA8A04", fontWeight: 500 }}>⏳ Aguardando primeiro acesso</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: "0.875rem", color: "var(--mf-texto-sec)" }}>{u.email}</td>
                    <td><PapelBadge papel={u.papel as Papel} /></td>
                    <td style={{ fontSize: "0.875rem", color: "var(--mf-texto-sec)" }}>
                      {(u.cliente as unknown as { nome: string } | null)?.nome ?? "—"}
                    </td>
                    <td>
                      <span className={u.ativo ? "mf-badge mf-badge-verde" : "mf-badge mf-badge-cinza"}>
                        {u.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                          <button
                            style={{ padding: "0.375rem", border: "none", background: "none", color: "var(--mf-texto-sec)", cursor: "pointer", borderRadius: 4 }}
                            onClick={() => setEditando(u)} title="Editar"
                          >
                            <IconEdit />
                          </button>
                          <button
                            style={{ padding: "0.375rem", border: "none", background: "none", color: u.ativo ? "var(--mf-vermelho)" : "var(--mf-verde)", cursor: "pointer", borderRadius: 4 }}
                            onClick={() => handleToggleAtivo(u)}
                            title={u.ativo ? "Desativar" : "Reativar"}
                          >
                            {u.ativo ? <IconUserX /> : <IconUserCheck />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modais */}
      {modalNovo && (
        <ModalNovoUsuario
          clientes={clientes}
          onClose={() => setModalNovo(false)}
          onSave={() => { setModalNovo(false); carregar(); }}
        />
      )}

      {editando && (
        <ModalEditarUsuario
          usuario={editando}
          clientes={clientes}
          onClose={() => setEditando(null)}
          onSave={() => { setEditando(null); carregar(); }}
        />
      )}
    </div>
  );
}

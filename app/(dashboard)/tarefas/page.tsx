"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Tarefa, Cliente, Usuario } from "@/lib/types";

// ── Ícones ───────────────────────────────────────────────────
function IconPlus() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function IconX() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function IconEdit() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function IconTrash() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}
function IconCheck() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function IconKanban() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="11" rx="1"/><rect x="10" y="3" width="5" height="6" rx="1"/><rect x="17" y="3" width="4" height="8" rx="1"/></svg>;
}
function IconList() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
}
function IconStar() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function IconAlert() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function IconChevronRight() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}

// ── Helpers ──────────────────────────────────────────────────
/** Data (YYYY-MM-DD) no fuso local, aceitando data pura ou data com hora */
function soData(iso: string | null | undefined): string {
  if (!iso) return "";
  if (!iso.includes("T")) return iso.slice(0, 10);
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return iso.slice(0, 10);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

function dataFmt(iso: string | null | undefined) {
  const d0 = soData(iso);
  if (!d0) return "—";
  const [y, m, d] = d0.split("-");
  return `${d}/${m}/${y}`;
}

function hoje() {
  return new Date().toISOString().split("T")[0];
}

const DIAS_CONCLUIDA_VISIVEL = 7;

function dataConclusao(t: Tarefa): string {
  return t.concluida_em ?? t.atualizado_em ?? t.criado_em ?? "";
}

/** Concluída/cancelada há mais de 7 dias → fica escondida por padrão */
function isAntiga(t: Tarefa): boolean {
  if (!["concluida", "cancelada"].includes(t.status)) return false;
  const d = dataConclusao(t);
  if (!d) return true;
  return Date.now() - new Date(d).getTime() > DIAS_CONCLUIDA_VISIVEL * 24 * 60 * 60 * 1000;
}

function isAtrasada(tarefa: Tarefa) {
  if (!tarefa.prazo) return false;
  if (["concluida", "cancelada"].includes(tarefa.status)) return false;
  return soData(tarefa.prazo) < hoje();
}

// ── Badges ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; cls: string; col: number }> = {
  pendente:     { label: "Pendente",     cls: "mf-badge mf-badge-cinza",    col: 0 },
  em_andamento: { label: "Em andamento", cls: "mf-badge mf-badge-azul",     col: 1 },
  em_revisao:   { label: "Em revisão",   cls: "mf-badge mf-badge-amarelo",  col: 2 },
  concluida:    { label: "Concluída",    cls: "mf-badge mf-badge-verde",    col: 3 },
  cancelada:    { label: "Cancelada",    cls: "mf-badge mf-badge-vermelho", col: 4 },
};

const PRIORIDADE_CONFIG: Record<string, { label: string; cls: string }> = {
  baixa:   { label: "Baixa",   cls: "mf-badge mf-badge-cinza"    },
  media:   { label: "Média",   cls: "mf-badge mf-badge-azul"     },
  alta:    { label: "Alta",    cls: "mf-badge mf-badge-amarelo"  },
  urgente: { label: "Urgente", cls: "mf-badge mf-badge-vermelho" },
};

const COLUNAS_KANBAN = [
  { key: "pendente",     label: "Pendente",     cor: "#6B7280" },
  { key: "em_andamento", label: "Em andamento", cor: "#3B82F6" },
  { key: "em_revisao",   label: "Em revisão",   cor: "#F59E0B" },
  { key: "concluida",    label: "Concluída",    cor: "#10B981" },
];

// ── Modal Tarefa ──────────────────────────────────────────────
interface ModalTarefaProps {
  tarefa: Partial<Tarefa> | null;
  clientes: Pick<Cliente, "id" | "nome">[];
  responsaveis: Pick<Usuario, "id" | "nome">[];
  onClose: () => void;
  onSave: () => void;
}

function ModalTarefa({ tarefa, clientes, responsaveis, onClose, onSave }: ModalTarefaProps) {
  const isEdicao = !!tarefa?.id;

  const [form, setForm] = useState({
    titulo:        tarefa?.titulo        ?? "",
    descricao:     tarefa?.descricao     ?? "",
    cliente_id:    tarefa?.cliente_id    ?? "",
    responsavel_id: tarefa?.responsavel_id ?? "",
    status:        tarefa?.status        ?? "pendente",
    prioridade:    tarefa?.prioridade    ?? "media",
    prazo:         soData(tarefa?.prazo),
  });
  const [salvando, setSalvando] = useState(false);
  const [erro,     setErro]     = useState("");

  function set(campo: string, valor: string) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) { setErro("Título é obrigatório."); return; }
    setSalvando(true); setErro("");

    const payload = {
      titulo:         form.titulo.trim(),
      descricao:      form.descricao.trim() || null,
      cliente_id:     form.cliente_id       || null,
      responsavel_id: form.responsavel_id   || null,
      status:         form.status,
      prioridade:     form.prioridade,
      // 18h de Marabá: evita a data "voltar um dia" por causa do fuso
      prazo:          form.prazo ? `${form.prazo}T18:00:00-03:00` : null,
    };

    const { error } = isEdicao
      ? await supabase.from("tarefas").update(payload).eq("id", tarefa!.id!)
      : await supabase.from("tarefas").insert({ ...payload, pontos_penalidade: 0, penalidade_aplicada: false });

    if (error) { setErro("Erro ao salvar. Tente novamente."); setSalvando(false); return; }
    onSave();
  }

  return (
    <div className="mf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mf-modal" style={{ maxWidth: 560 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--mf-borda)" }}>
          <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700 }}>{isEdicao ? "Editar tarefa" : "Nova tarefa"}</h2>
          <button onClick={onClose} style={{ padding: "0.25rem", border: "none", background: "none", color: "var(--mf-texto-sec)", cursor: "pointer", borderRadius: 4 }}><IconX /></button>
        </div>

        <form onSubmit={handleSalvar} style={{ padding: "1.5rem" }}>
          <div style={{ marginBottom: "0.875rem" }}>
            <label className="mf-label">Título *</label>
            <input type="text" className="mf-input" placeholder="Ex: Criar artes para campanha de Natal" value={form.titulo} onChange={e => set("titulo", e.target.value)} />
          </div>

          <div style={{ marginBottom: "0.875rem" }}>
            <label className="mf-label">Descrição</label>
            <textarea className="mf-input" rows={3} placeholder="Detalhes da tarefa..." value={form.descricao} onChange={e => set("descricao", e.target.value)} style={{ resize: "vertical" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            <div style={{ marginBottom: "0.875rem", gridColumn: "1 / -1" }}>
              <label className="mf-label">Cliente</label>
              <select className="mf-input" value={form.cliente_id} onChange={e => set("cliente_id", e.target.value)}>
                <option value="">Sem cliente específico</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Responsável</label>
              <select className="mf-input" value={form.responsavel_id} onChange={e => set("responsavel_id", e.target.value)}>
                <option value="">Não atribuído</option>
                {responsaveis.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Prazo</label>
              <input type="date" className="mf-input" value={form.prazo} onChange={e => set("prazo", e.target.value)} />
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Prioridade</label>
              <select className="mf-input" value={form.prioridade} onChange={e => set("prioridade", e.target.value)}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label className="mf-label">Status</label>
              <select className="mf-input" value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em andamento</option>
                <option value="em_revisao">Em revisão</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          {erro && (
            <div style={{ background: "#FEF2F2", color: "var(--mf-vermelho)", border: "1px solid #FECACA", borderRadius: 8, padding: "0.75rem", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {erro}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button type="button" className="mf-btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="mf-btn-primary" disabled={salvando}>
              {salvando ? "Salvando..." : isEdicao ? "Salvar alterações" : "Criar tarefa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Card Kanban ───────────────────────────────────────────────
interface CardTarefaProps {
  tarefa: Tarefa & { cliente?: { nome: string } | null; responsavel?: { nome: string } | null };
  onEditar: () => void;
  onDeletar: () => void;
  onMoverStatus: (novoStatus: string) => void;
  statusList: string[];
}

function CardTarefa({ tarefa, onEditar, onDeletar, onMoverStatus, statusList }: CardTarefaProps) {
  const atrasada = isAtrasada(tarefa);
  const prio = PRIORIDADE_CONFIG[tarefa.prioridade];
  const clienteNome = (tarefa.cliente as unknown as { nome: string } | null)?.nome;
  const respNome    = (tarefa.responsavel as unknown as { nome: string } | null)?.nome;

  const idxAtual = statusList.indexOf(tarefa.status);
  const podeMover = idxAtual < statusList.length - 1;

  return (
    <div style={{
      background: "white",
      borderRadius: 10,
      padding: "0.875rem",
      border: "1px solid var(--mf-borda)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      cursor: "default",
    }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
            {atrasada && (
              <span style={{ color: "var(--mf-vermelho)", flexShrink: 0, display: "flex", alignItems: "center" }} title="Atrasada">
                <IconAlert />
              </span>
            )}
            <span style={{ fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.3 }}>{tarefa.titulo}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.125rem", flexShrink: 0 }}>
          <button onClick={onEditar} style={{ padding: "0.25rem", border: "none", background: "none", color: "var(--mf-texto-sec)", cursor: "pointer", borderRadius: 4 }} title="Editar"><IconEdit /></button>
          <button onClick={onDeletar} style={{ padding: "0.25rem", border: "none", background: "none", color: "var(--mf-vermelho)", cursor: "pointer", borderRadius: 4 }} title="Excluir"><IconTrash /></button>
        </div>
      </div>

      {tarefa.descricao && (
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "var(--mf-texto-sec)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {tarefa.descricao}
        </p>
      )}

      {/* Badges */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.625rem" }}>
        <span className={prio.cls}>{prio.label}</span>
        {clienteNome && <span className="mf-badge mf-badge-cinza" style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clienteNome}</span>}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--mf-texto-sec)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
          {respNome && <span>👤 {respNome}</span>}
          {tarefa.prazo && (
            <span style={{ color: atrasada ? "var(--mf-vermelho)" : "inherit" }}>
              📅 {dataFmt(tarefa.prazo)}{atrasada ? " · Atrasada" : ""}
            </span>
          )}
        </div>

        {podeMover && (
          <button
            onClick={() => onMoverStatus(statusList[idxAtual + 1])}
            title="Avançar status"
            style={{
              display: "flex", alignItems: "center", gap: "0.25rem",
              padding: "0.25rem 0.5rem", borderRadius: 6, border: "1px solid var(--mf-borda)",
              background: "var(--mf-fundo)", fontSize: "0.6875rem", cursor: "pointer",
              color: "var(--mf-texto-sec)", whiteSpace: "nowrap",
            }}
          >
            Avançar <IconChevronRight />
          </button>
        )}
        {!podeMover && tarefa.status !== "cancelada" && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#10B981", fontWeight: 600 }}>
            <IconCheck /> Concluída
          </span>
        )}
      </div>
    </div>
  );
}

// ── View Kanban ───────────────────────────────────────────────
interface ViewKanbanProps {
  tarefas: (Tarefa & { cliente?: { nome: string } | null; responsavel?: { nome: string } | null })[];
  onEditar: (t: Tarefa) => void;
  onDeletar: (id: string) => void;
  onAtualizarStatus: (id: string, status: string) => void;
}

const LIMITE_CONCLUIDAS = 5;

function ViewKanban({ tarefas, onEditar, onDeletar, onAtualizarStatus }: ViewKanbanProps) {
  const statusList = COLUNAS_KANBAN.map(c => c.key);
  const [verTodasConcluidas, setVerTodasConcluidas] = useState(false);

  return (
    <div className="tarefas-kanban" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", overflowX: "auto" }}>
      {COLUNAS_KANBAN.map(coluna => {
        const todos = tarefas.filter(t => t.status === coluna.key);
        // Concluídas: as mais recentes primeiro, e só algumas por vez
        const ordenados = coluna.key === "concluida"
          ? [...todos].sort((a, b) => dataConclusao(b).localeCompare(dataConclusao(a)))
          : todos;
        const limitar = coluna.key === "concluida" && !verTodasConcluidas && ordenados.length > LIMITE_CONCLUIDAS;
        const items = limitar ? ordenados.slice(0, LIMITE_CONCLUIDAS) : ordenados;
        const escondidos = ordenados.length - items.length;
        return (
          <div key={coluna.key} className="tarefas-coluna" style={{ minWidth: 220 }}>
            {/* Cabeçalho da coluna */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", padding: "0.5rem 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: coluna.cor }} />
                <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{coluna.label}</span>
              </div>
              <span style={{
                minWidth: 22, height: 22, borderRadius: 999, background: "var(--mf-fundo)",
                border: "1px solid var(--mf-borda)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "var(--mf-texto-sec)"
              }}>{todos.length}</span>
            </div>

            {/* Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", minHeight: 80 }}>
              {items.length === 0 ? (
                <div style={{ padding: "1.5rem 0.75rem", textAlign: "center", border: "2px dashed var(--mf-borda)", borderRadius: 10, color: "var(--mf-texto-sec)", fontSize: "0.75rem" }}>
                  Vazio
                </div>
              ) : items.map(t => (
                <CardTarefa
                  key={t.id}
                  tarefa={t}
                  statusList={statusList}
                  onEditar={() => onEditar(t)}
                  onDeletar={() => onDeletar(t.id)}
                  onMoverStatus={novoStatus => onAtualizarStatus(t.id, novoStatus)}
                />
              ))}
              {coluna.key === "concluida" && (escondidos > 0 || verTodasConcluidas) && ordenados.length > LIMITE_CONCLUIDAS && (
                <button
                  onClick={() => setVerTodasConcluidas(v => !v)}
                  style={{ padding: "0.625rem", border: "1px dashed var(--mf-borda)", borderRadius: 10, background: "white", color: "var(--mf-texto-sec)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
                >
                  {verTodasConcluidas ? "Mostrar menos" : `Ver mais ${escondidos} concluída${escondidos !== 1 ? "s" : ""}`}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── View Lista ────────────────────────────────────────────────
interface ViewListaProps {
  tarefas: (Tarefa & { cliente?: { nome: string } | null; responsavel?: { nome: string } | null })[];
  onEditar: (t: Tarefa) => void;
  onDeletar: (id: string) => void;
  onAtualizarStatus: (id: string, status: string) => void;
}

function ViewLista({ tarefas, onEditar, onDeletar, onAtualizarStatus }: ViewListaProps) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="mf-table">
        <thead>
          <tr>
            <th>Tarefa</th>
            <th>Cliente</th>
            <th>Responsável</th>
            <th>Prazo</th>
            <th>Prioridade</th>
            <th>Status</th>
            <th style={{ width: 90, textAlign: "center" }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {tarefas.map(t => {
            const atrasada  = isAtrasada(t);
            const prio      = PRIORIDADE_CONFIG[t.prioridade];
            const st        = STATUS_CONFIG[t.status];
            const clienteNome = (t.cliente as unknown as { nome: string } | null)?.nome ?? "—";
            const respNome    = (t.responsavel as unknown as { nome: string } | null)?.nome ?? "—";
            return (
              <tr key={t.id} style={{ background: atrasada ? "#FFF5F5" : undefined }}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    {atrasada && <span style={{ color: "var(--mf-vermelho)" }}><IconAlert /></span>}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{t.titulo}</div>
                      {t.descricao && <div style={{ fontSize: "0.75rem", color: "var(--mf-texto-sec)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.descricao}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: "0.875rem", color: "var(--mf-texto-sec)" }}>{clienteNome}</td>
                <td style={{ fontSize: "0.875rem", color: "var(--mf-texto-sec)" }}>{respNome}</td>
                <td style={{ fontSize: "0.875rem", color: atrasada ? "var(--mf-vermelho)" : "var(--mf-texto-sec)", fontWeight: atrasada ? 600 : 400 }}>
                  {dataFmt(t.prazo)}
                </td>
                <td><span className={prio.cls}>{prio.label}</span></td>
                <td>
                  <select
                    value={t.status}
                    onChange={e => onAtualizarStatus(t.id, e.target.value)}
                    style={{ border: "none", background: "none", fontSize: "0.8125rem", cursor: "pointer", color: "var(--mf-texto)", fontWeight: 500 }}
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                    <button onClick={() => onEditar(t)} style={{ padding: "0.3rem", border: "none", background: "none", color: "var(--mf-texto-sec)", cursor: "pointer", borderRadius: 4 }} title="Editar"><IconEdit /></button>
                    <button onClick={() => onDeletar(t.id)} style={{ padding: "0.3rem", border: "none", background: "none", color: "var(--mf-vermelho)", cursor: "pointer", borderRadius: 4 }} title="Excluir"><IconTrash /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {tarefas.length === 0 && (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--mf-texto-sec)", fontSize: "0.875rem" }}>
          Nenhuma tarefa encontrada.
        </div>
      )}
    </div>
  );
}

// ── Aba Pontuação ─────────────────────────────────────────────
const VALOR_POR_PONTO = 50; // R$ por ponto de penalidade

interface AbaPontuacaoProps {
  tarefas: (Tarefa & { responsavel?: { nome: string } | null })[];
  responsaveis: Pick<Usuario, "id" | "nome">[];
}

function AbaPontuacao({ tarefas, responsaveis }: AbaPontuacaoProps) {
  // Calcula pontuação por responsável
  const ranking = responsaveis
    .map(resp => {
      const minhasTarefas = tarefas.filter(t => t.responsavel_id === resp.id);
      const atrasadas     = minhasTarefas.filter(t => isAtrasada(t)).length;
      const concluidas    = minhasTarefas.filter(t => t.status === "concluida").length;
      const emAndamento   = minhasTarefas.filter(t => t.status === "em_andamento").length;
      const penalidade    = atrasadas * VALOR_POR_PONTO;
      return {
        id: resp.id,
        nome: resp.nome,
        total: minhasTarefas.length,
        concluidas,
        emAndamento,
        atrasadas,
        pontos: atrasadas,
        penalidade,
        pct: minhasTarefas.length > 0 ? Math.round((concluidas / minhasTarefas.length) * 100) : 0,
      };
    })
    .filter(r => r.total > 0)
    .sort((a, b) => a.atrasadas - b.atrasadas || b.pct - a.pct);

  const totalAtrasadas = tarefas.filter(isAtrasada).length;
  const totalConcluidas = tarefas.filter(t => t.status === "concluida").length;
  const totalPenalidade = totalAtrasadas * VALOR_POR_PONTO;

  function brl(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <div>
      {/* Cards de resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="mf-card mf-stat-card">
          <div className="mf-stat-label">Tarefas atrasadas</div>
          <div className="mf-stat-value" style={{ color: totalAtrasadas > 0 ? "var(--mf-vermelho)" : "inherit" }}>
            {totalAtrasadas}
          </div>
          {totalAtrasadas > 0 && <div style={{ fontSize: "0.75rem", color: "var(--mf-texto-sec)" }}>1 ponto = {brl(VALOR_POR_PONTO)} de penalidade</div>}
        </div>
        <div className="mf-card mf-stat-card">
          <div className="mf-stat-label">Tarefas concluídas</div>
          <div className="mf-stat-value" style={{ color: "var(--mf-verde)" }}>{totalConcluidas}</div>
        </div>
        <div className="mf-card mf-stat-card" style={{ borderLeft: `3px solid ${totalPenalidade > 0 ? "var(--mf-vermelho)" : "var(--mf-verde)"}` }}>
          <div className="mf-stat-label">Penalidade total</div>
          <div className="mf-stat-value" style={{ color: totalPenalidade > 0 ? "var(--mf-vermelho)" : "var(--mf-verde)" }}>
            {brl(totalPenalidade)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--mf-texto-sec)" }}>{totalAtrasadas} atraso{totalAtrasadas !== 1 ? "s" : ""} × {brl(VALOR_POR_PONTO)}</div>
        </div>
      </div>

      {/* Regra de pontuação */}
      <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "0.875rem 1rem", marginBottom: "1.5rem", fontSize: "0.875rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <div style={{ color: "#F97316", flexShrink: 0, marginTop: 1 }}><IconStar /></div>
        <div>
          <div style={{ fontWeight: 700, color: "#C2410C", marginBottom: "0.25rem" }}>Regra de pontuação</div>
          <div style={{ color: "#7C2D12", lineHeight: 1.5 }}>
            Cada tarefa atrasada gera <strong>1 ponto de penalidade</strong> e desconta <strong>{brl(VALOR_POR_PONTO)}</strong> do salário do responsável.
            Tarefas com status <em>Concluída</em> ou <em>Cancelada</em> não são penalizadas.
          </div>
        </div>
      </div>

      {/* Ranking */}
      {ranking.length === 0 ? (
        <div className="mf-card">
          <div className="mf-empty">
            <div className="mf-empty-icon">🏆</div>
            <div className="mf-empty-title">Sem dados de equipe ainda</div>
            <p style={{ fontSize: "0.875rem", color: "var(--mf-texto-sec)", margin: "0.25rem 0 0" }}>
              Atribua tarefas à equipe para ver a pontuação.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem" }}>Desempenho da equipe</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {ranking.map((r, idx) => (
              <div key={r.id} className="mf-card" style={{ padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  {/* Posição */}
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    background: idx === 0 ? "#FEF9C3" : idx === 1 ? "#F3F4F6" : "#FEF2F2",
                    color: idx === 0 ? "#CA8A04" : idx === 1 ? "#6B7280" : "var(--mf-vermelho)",
                    fontWeight: 800, fontSize: "0.875rem",
                  }}>
                    {idx + 1}
                  </div>

                  {/* Nome */}
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{r.nome}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--mf-texto-sec)" }}>
                      {r.total} tarefa{r.total !== 1 ? "s" : ""} · {r.concluidas} concluída{r.concluidas !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div style={{ flex: 2, minWidth: 120 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                      <span style={{ color: "var(--mf-texto-sec)" }}>Taxa de conclusão</span>
                      <span style={{ fontWeight: 700 }}>{r.pct}%</span>
                    </div>
                    <div style={{ height: 8, background: "var(--mf-fundo)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${r.pct}%`, background: r.pct >= 70 ? "#10B981" : r.pct >= 40 ? "#F59E0B" : "var(--mf-vermelho)", borderRadius: 999, transition: "width 600ms ease" }} />
                    </div>
                  </div>

                  {/* Atrasadas + penalidade */}
                  <div style={{ textAlign: "right", minWidth: 110 }}>
                    {r.atrasadas > 0 ? (
                      <>
                        <div style={{ color: "var(--mf-vermelho)", fontWeight: 700, fontSize: "0.875rem" }}>
                          {r.atrasadas} atraso{r.atrasadas !== 1 ? "s" : ""}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--mf-vermelho)" }}>
                          Penalidade: {brl(r.penalidade)}
                        </div>
                      </>
                    ) : (
                      <div style={{ color: "#10B981", fontWeight: 700, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "flex-end" }}>
                        <IconCheck /> Sem atrasos
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function TarefasPage() {

  type TarefaCompleta = Tarefa & { cliente?: { nome: string } | null; responsavel?: { nome: string } | null };

  const [tarefas,      setTarefas]      = useState<TarefaCompleta[]>([]);
  const [clientes,     setClientes]     = useState<Pick<Cliente, "id" | "nome">[]>([]);
  const [responsaveis, setResponsaveis] = useState<Pick<Usuario, "id" | "nome">[]>([]);
  const [carregando,   setCarregando]   = useState(true);

  const [aba,          setAba]          = useState<"tarefas" | "pontuacao">("tarefas");
  const [view,         setView]         = useState<"kanban" | "lista">("kanban");
  const [modalAberto,  setModalAberto]  = useState(false);
  const [editando,     setEditando]     = useState<Partial<Tarefa> | null>(null);
  const [deletando,    setDeletando]    = useState<string | null>(null);

  // Filtros
  const [filtroBusca,   setFiltroBusca]   = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroResp,    setFiltroResp]    = useState("");
  const [filtroStatus,  setFiltroStatus]  = useState("");
  const [filtroPrio,    setFiltroPrio]    = useState("");
  const [mostrarAntigas, setMostrarAntigas] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data } = await supabase
      .from("tarefas")
      .select("*, cliente:cliente_id(id, nome), responsavel:responsavel_id(id, nome)")
      .order("criado_em", { ascending: false });
    if (data) setTarefas(data as TarefaCompleta[]);
    setCarregando(false);
  }, [supabase]);

  useEffect(() => {
    carregar();
    supabase.from("clientes").select("id, nome").eq("status", "ativo").order("nome")
      .then(({ data }) => { if (data) setClientes(data); });
    supabase.from("usuarios").select("id, nome").in("papel", ["admin", "equipe"]).eq("ativo", true).order("nome")
      .then(({ data }) => { if (data) setResponsaveis(data); });
  }, [carregar, supabase]);

  async function handleAtualizarStatus(id: string, novoStatus: string) {
    const extra: Record<string, unknown> = {};
    if (novoStatus === "concluida") extra.concluida_em = new Date().toISOString();
    await supabase.from("tarefas").update({ status: novoStatus, ...extra }).eq("id", id);
    await carregar();
  }

  async function handleDeletar(id: string) {
    await supabase.from("tarefas").delete().eq("id", id);
    setDeletando(null);
    await carregar();
  }

  // Filtros
  const filtradas = tarefas.filter(t => {
    const clienteNome = (t.cliente as unknown as { nome: string } | null)?.nome ?? "";
    const respNome    = (t.responsavel as unknown as { nome: string } | null)?.nome ?? "";
    if (filtroBusca   && !t.titulo.toLowerCase().includes(filtroBusca.toLowerCase()) && !clienteNome.toLowerCase().includes(filtroBusca.toLowerCase())) return false;
    if (filtroCliente && t.cliente_id    !== filtroCliente)  return false;
    if (filtroResp    && t.responsavel_id !== filtroResp)    return false;
    if (filtroStatus  && t.status         !== filtroStatus)  return false;
    if (filtroPrio    && t.prioridade     !== filtroPrio)    return false;
    // Concluídas antigas somem, a não ser que peça para ver
    if (!mostrarAntigas && !filtroBusca && isAntiga(t)) return false;
    return true;
  });

  const qtdAntigas = tarefas.filter(isAntiga).length;

  const contPorStatus = {
    pendente:     tarefas.filter(t => t.status === "pendente").length,
    em_andamento: tarefas.filter(t => t.status === "em_andamento").length,
    em_revisao:   tarefas.filter(t => t.status === "em_revisao").length,
    concluida:    tarefas.filter(t => t.status === "concluida").length,
    atrasadas:    tarefas.filter(isAtrasada).length,
  };

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mf-page-header">
        <div>
          <h1 className="mf-page-title">Tarefas & Equipe</h1>
          <p className="mf-page-subtitle">{tarefas.length} tarefa{tarefas.length !== 1 ? "s" : ""}{contPorStatus.atrasadas > 0 ? ` · ${contPorStatus.atrasadas} atrasada${contPorStatus.atrasadas !== 1 ? "s" : ""}` : ""}</p>
        </div>
        <button className="mf-btn-primary" onClick={() => { setEditando(null); setModalAberto(true); }} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <IconPlus /> Nova tarefa
        </button>
      </div>

      {/* Abas principais */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem", borderBottom: "1px solid var(--mf-borda)", paddingBottom: 0 }}>
        {[
          { key: "tarefas",    label: "Tarefas" },
          { key: "pontuacao",  label: "Pontuação da equipe" },
        ].map(a => (
          <button
            key={a.key}
            onClick={() => setAba(a.key as typeof aba)}
            style={{
              padding: "0.5rem 1rem", border: "none", background: "none", cursor: "pointer",
              fontSize: "0.875rem", fontWeight: 600,
              borderBottom: aba === a.key ? "2px solid var(--mf-laranja)" : "2px solid transparent",
              color: aba === a.key ? "var(--mf-laranja)" : "var(--mf-texto-sec)",
              marginBottom: "-1px",
            }}
          >
            {a.label}
            {a.key === "pontuacao" && contPorStatus.atrasadas > 0 && (
              <span style={{ marginLeft: "0.375rem", background: "var(--mf-vermelho)", color: "white", borderRadius: 999, fontSize: "0.6875rem", padding: "0 5px", fontWeight: 700 }}>
                {contPorStatus.atrasadas}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Aba Tarefas */}
      {aba === "tarefas" && (
        <>
          {/* Stats */}
          <div className="tarefas-stats" style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            {[
              { label: "Pendentes",     valor: contPorStatus.pendente,     cor: "#6B7280" },
              { label: "Em andamento",  valor: contPorStatus.em_andamento,  cor: "#3B82F6" },
              { label: "Em revisão",    valor: contPorStatus.em_revisao,    cor: "#F59E0B" },
              { label: "Concluídas",    valor: contPorStatus.concluida,     cor: "#10B981" },
              { label: "Atrasadas",     valor: contPorStatus.atrasadas,     cor: contPorStatus.atrasadas > 0 ? "var(--mf-vermelho)" : "#10B981" },
            ].map(s => (
              <div key={s.label} style={{ background: "white", border: "1px solid var(--mf-borda)", borderRadius: 8, padding: "0.5rem 0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontWeight: 800, fontSize: "1rem", color: s.cor }}>{s.valor}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--mf-texto-sec)" }}>{s.label}</span>
              </div>
            ))}
          </div>

          {qtdAntigas > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", background: "var(--mf-fundo)", border: "1px solid var(--mf-borda)", borderRadius: 10, padding: "0.5rem 0.875rem", marginBottom: "1rem", fontSize: "0.8125rem", color: "var(--mf-texto-sec)" }}>
              <span>
                {mostrarAntigas
                  ? `Mostrando também ${qtdAntigas} tarefa${qtdAntigas !== 1 ? "s" : ""} concluída${qtdAntigas !== 1 ? "s" : ""} há mais de ${DIAS_CONCLUIDA_VISIVEL} dias.`
                  : `${qtdAntigas} tarefa${qtdAntigas !== 1 ? "s" : ""} concluída${qtdAntigas !== 1 ? "s" : ""} há mais de ${DIAS_CONCLUIDA_VISIVEL} dias ${qtdAntigas !== 1 ? "estão arquivadas" : "está arquivada"}.`}
              </span>
              <button
                onClick={() => setMostrarAntigas(v => !v)}
                style={{ border: "none", background: "none", color: "var(--mf-laranja)", fontWeight: 700, cursor: "pointer", fontSize: "0.8125rem", padding: 0 }}
              >
                {mostrarAntigas ? "Esconder antigas" : "Ver antigas"}
              </button>
            </div>
          )}

          {/* Filtros e switch de view */}
          <div className="tarefas-filtros" style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <input type="text" className="mf-input" placeholder="Buscar..." value={filtroBusca} onChange={e => setFiltroBusca(e.target.value)} style={{ flex: "1 1 160px", maxWidth: 220 }} />
            <select className="mf-input" style={{ width: "auto" }} value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}>
              <option value="">Todos clientes</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <select className="mf-input" style={{ width: "auto" }} value={filtroResp} onChange={e => setFiltroResp(e.target.value)}>
              <option value="">Toda equipe</option>
              {responsaveis.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
            <select className="mf-input" style={{ width: "auto" }} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select className="mf-input" style={{ width: "auto" }} value={filtroPrio} onChange={e => setFiltroPrio(e.target.value)}>
              <option value="">Todas prioridades</option>
              {Object.entries(PRIORIDADE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>

            {/* Switch kanban/lista */}
            <div style={{ marginLeft: "auto", display: "flex", border: "1px solid var(--mf-borda)", borderRadius: 8, overflow: "hidden" }}>
              {[
                { key: "kanban", icon: <IconKanban />, title: "Kanban" },
                { key: "lista",  icon: <IconList />,   title: "Lista"  },
              ].map(v => (
                <button
                  key={v.key}
                  onClick={() => setView(v.key as "kanban" | "lista")}
                  title={v.title}
                  style={{
                    padding: "0.4rem 0.75rem", border: "none", cursor: "pointer",
                    background: view === v.key ? "var(--mf-laranja)" : "white",
                    color: view === v.key ? "white" : "var(--mf-texto-sec)",
                    display: "flex", alignItems: "center",
                  }}
                >
                  {v.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Conteúdo */}
          {carregando ? (
            <div style={{ padding: "3rem", textAlign: "center" }}><div className="mf-spinner" style={{ margin: "0 auto" }} /></div>
          ) : filtradas.length === 0 && tarefas.length === 0 ? (
            <div className="mf-card">
              <div className="mf-empty">
                <div className="mf-empty-icon">✅</div>
                <div className="mf-empty-title">Nenhuma tarefa ainda</div>
                <p style={{ fontSize: "0.875rem", color: "var(--mf-texto-sec)", margin: "0.25rem 0 1rem" }}>Crie a primeira tarefa para a equipe.</p>
                <button className="mf-btn-primary" onClick={() => { setEditando(null); setModalAberto(true); }} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                  <IconPlus /> Nova tarefa
                </button>
              </div>
            </div>
          ) : view === "kanban" ? (
            <ViewKanban
              tarefas={filtradas}
              onEditar={t => { setEditando(t); setModalAberto(true); }}
              onDeletar={id => setDeletando(id)}
              onAtualizarStatus={handleAtualizarStatus}
            />
          ) : (
            <div className="mf-card" style={{ padding: 0 }}>
              <ViewLista
                tarefas={filtradas}
                onEditar={t => { setEditando(t); setModalAberto(true); }}
                onDeletar={id => setDeletando(id)}
                onAtualizarStatus={handleAtualizarStatus}
              />
            </div>
          )}
        </>
      )}

      {/* Aba Pontuação */}
      {aba === "pontuacao" && (
        <AbaPontuacao tarefas={tarefas} responsaveis={responsaveis} />
      )}

      {/* Modal tarefa */}
      {modalAberto && (
        <ModalTarefa
          tarefa={editando}
          clientes={clientes}
          responsaveis={responsaveis}
          onClose={() => { setModalAberto(false); setEditando(null); }}
          onSave={() => { setModalAberto(false); setEditando(null); carregar(); }}
        />
      )}

      {/* Confirmação exclusão */}
      {deletando && (
        <div className="mf-overlay">
          <div className="mf-modal" style={{ maxWidth: 400 }}>
            <div style={{ padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 700 }}>Excluir tarefa?</h3>
              <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "var(--mf-texto-sec)" }}>Esta ação não pode ser desfeita.</p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button className="mf-btn-secondary" onClick={() => setDeletando(null)}>Cancelar</button>
                <button className="mf-btn-primary" style={{ background: "var(--mf-vermelho)" }} onClick={() => handleDeletar(deletando)}>Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

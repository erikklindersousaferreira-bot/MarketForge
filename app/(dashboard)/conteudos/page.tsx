"use client";

// app/(dashboard)/conteudos/page.tsx — Todos os conteúdos de todos os planejamentos
import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  LayoutGrid,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { Conteudo } from "@/lib/types";

// ── Tipos ────────────────────────────────────────────────────
type PlanejamentoOpcao = {
  id: string;
  mes_referencia: string;
  cliente: { id: string; nome: string } | null;
};

type ConteudoLinha = Conteudo & {
  planejamento: PlanejamentoOpcao | null;
};

// ── Constantes ───────────────────────────────────────────────
const PLATAFORMAS = ["Instagram", "Facebook", "TikTok", "YouTube", "LinkedIn", "WhatsApp", "Site", "Outro"];
const FORMATOS = ["Feed", "Stories", "Reels", "Carrossel", "Vídeo", "Blog", "E-mail", "Outro"];

const STATUS: Record<string, { label: string; cls: string }> = {
  rascunho:  { label: "Rascunho",  cls: "mf-badge mf-badge-cinza" },
  aprovado:  { label: "Aprovado",  cls: "mf-badge mf-badge-azul" },
  agendado:  { label: "Agendado",  cls: "mf-badge mf-badge-amarelo" },
  publicado: { label: "Publicado", cls: "mf-badge mf-badge-verde" },
  cancelado: { label: "Cancelado", cls: "mf-badge mf-badge-vermelho" },
};

type ClienteStory = { id: string; nome: string; logo_url: string | null; cor_primaria: string | null };

function iniciaisCli(nome: string) {
  return (nome || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

/** Bolinha do cliente estilo stories: anel laranja quando tem conteúdo esperando */
function StoryCliente({ cliente, ativo, pendentes, onClick }: { cliente: ClienteStory | null; ativo: boolean; pendentes: number; onClick: () => void }) {
  const nome = cliente?.nome ?? "Todos";
  const anel = ativo
    ? "conic-gradient(#FF6A00, #FF6A00)"
    : pendentes > 0 ? "conic-gradient(#FF6A00, #F59E0B, #FF6A00)" : "#E4E4E7";
  return (
    <button onClick={onClick} title={nome} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, border: "none", background: "none", cursor: "pointer", flexShrink: 0, width: 72, padding: 0 }}>
      <span style={{ position: "relative", width: 64, height: 64, borderRadius: "50%", padding: 3, background: anel, display: "flex" }}>
        <span style={{ flex: 1, borderRadius: "50%", background: "#fff", padding: 2, display: "flex" }}>
          {cliente?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cliente.logo_url} alt={nome} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <span style={{ flex: 1, borderRadius: "50%", background: cliente ? (cliente.cor_primaria || "#FF6A00") : "#18181B", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: cliente ? 17 : 13 }}>
              {cliente ? iniciaisCli(nome) : <LayoutGrid size={20} />}
            </span>
          )}
        </span>
        {pendentes > 0 && (
          <span style={{ position: "absolute", top: -2, right: -2, minWidth: 20, height: 20, borderRadius: 999, background: "#FF6A00", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", border: "2px solid #fff" }}>
            {pendentes > 9 ? "9+" : pendentes}
          </span>
        )}
      </span>
      <span style={{ fontSize: 11.5, fontWeight: ativo ? 700 : 500, color: ativo ? "var(--mf-laranja)" : "var(--mf-texto)", maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {nome}
      </span>
    </button>
  );
}

// ── Helpers ──────────────────────────────────────────────────
function dataFmt(iso: string | null | undefined) {
  if (!iso) return "Sem data";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function mesFmt(iso: string | null | undefined) {
  if (!iso) return "";
  const [y, m] = iso.slice(0, 10).split("-");
  const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${nomes[Number(m) - 1] ?? m}/${y}`;
}

function rotuloPlanejamento(p: PlanejamentoOpcao) {
  return `${p.cliente?.nome ?? "Sem cliente"} — ${mesFmt(p.mes_referencia)}`;
}

// ── Modal criar / editar ─────────────────────────────────────
function ModalConteudo({
  conteudo,
  planejamentos,
  onClose,
  onSave,
}: {
  conteudo: Partial<ConteudoLinha> | null;
  planejamentos: PlanejamentoOpcao[];
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdicao = !!conteudo?.id;
  const [form, setForm] = useState({
    planejamento_id: conteudo?.planejamento_id ?? planejamentos[0]?.id ?? "",
    titulo: conteudo?.titulo ?? "",
    plataforma: conteudo?.plataforma ?? "Instagram",
    formato: conteudo?.formato ?? "Feed",
    status: conteudo?.status ?? "rascunho",
    data_publicacao: conteudo?.data_publicacao ?? "",
    legenda: conteudo?.legenda ?? "",
    hashtags: conteudo?.hashtags ?? "",
    responsavel: conteudo?.responsavel ?? "",
    observacoes: conteudo?.observacoes ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function set(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.planejamento_id) { setErro("Selecione o planejamento."); return; }
    if (!form.titulo.trim()) { setErro("Título é obrigatório."); return; }
    setSalvando(true);
    setErro("");

    const payload = {
      planejamento_id: form.planejamento_id,
      titulo: form.titulo.trim(),
      plataforma: form.plataforma,
      formato: form.formato,
      status: form.status,
      data_publicacao: form.data_publicacao || null,
      legenda: form.legenda.trim() || null,
      hashtags: form.hashtags.trim() || null,
      responsavel: form.responsavel.trim() || null,
      observacoes: form.observacoes.trim() || null,
    };

    const { error } = isEdicao
      ? await supabase.from("conteudos").update(payload).eq("id", conteudo!.id!)
      : await supabase.from("conteudos").insert(payload);

    if (error) {
      console.error("[conteudos] erro ao salvar:", error);
      setErro("Erro ao salvar. Tente novamente.");
      setSalvando(false);
      return;
    }
    onSave();
  }

  return (
    <div className="mf-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mf-modal" style={{ maxWidth: 580 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--mf-borda)" }}>
          <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700 }}>
            {isEdicao ? "Editar conteúdo" : "Novo conteúdo"}
          </h2>
          <button onClick={onClose} aria-label="Fechar" style={{ padding: "0.25rem", border: "none", background: "none", color: "var(--mf-texto-sec)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSalvar} style={{ padding: "1.5rem" }}>
          <div style={{ marginBottom: "0.875rem" }}>
            <label className="mf-label">Planejamento (cliente / mês) *</label>
            <select className="mf-input" value={form.planejamento_id} onChange={(e) => set("planejamento_id", e.target.value)}>
              <option value="">Selecione...</option>
              {planejamentos.map((p) => (
                <option key={p.id} value={p.id}>{rotuloPlanejamento(p)}</option>
              ))}
            </select>
            {planejamentos.length === 0 && (
              <p style={{ fontSize: "0.75rem", color: "var(--mf-texto-sec)", marginTop: "0.375rem" }}>
                Crie um planejamento primeiro em <Link href="/planejamento" style={{ color: "var(--mf-laranja)" }}>Planejamento</Link>.
              </p>
            )}
          </div>

          <div style={{ marginBottom: "0.875rem" }}>
            <label className="mf-label">Título *</label>
            <input className="mf-input" placeholder="Ex: Post do Dia dos Pais" value={form.titulo} onChange={(e) => set("titulo", e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Plataforma</label>
              <select className="mf-input" value={form.plataforma} onChange={(e) => set("plataforma", e.target.value)}>
                {PLATAFORMAS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Formato</label>
              <select className="mf-input" value={form.formato} onChange={(e) => set("formato", e.target.value)}>
                {FORMATOS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Status</label>
              <select className="mf-input" value={form.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Data de publicação</label>
              <input type="date" className="mf-input" value={form.data_publicacao ?? ""} onChange={(e) => set("data_publicacao", e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: "0.875rem" }}>
            <label className="mf-label">Legenda</label>
            <textarea className="mf-input" rows={4} value={form.legenda ?? ""} onChange={(e) => set("legenda", e.target.value)} style={{ resize: "vertical" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Hashtags</label>
              <input className="mf-input" placeholder="#marketing #marabá" value={form.hashtags ?? ""} onChange={(e) => set("hashtags", e.target.value)} />
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Responsável</label>
              <input className="mf-input" placeholder="Nome" value={form.responsavel ?? ""} onChange={(e) => set("responsavel", e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="mf-label">Observações</label>
            <textarea className="mf-input" rows={2} value={form.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} style={{ resize: "vertical" }} />
          </div>

          {erro && (
            <div style={{ background: "var(--mf-vermelho-bg)", color: "var(--mf-vermelho)", borderRadius: 8, padding: "0.625rem 0.875rem", fontSize: "0.8125rem", marginBottom: "1rem" }}>
              {erro}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button type="button" className="mf-btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="mf-btn-primary" disabled={salvando}>
              {salvando ? "Salvando..." : isEdicao ? "Salvar alterações" : "Criar conteúdo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página ───────────────────────────────────────────────────
export default function ConteudosPage() {
  const [conteudos, setConteudos] = useState<ConteudoLinha[]>([]);
  const [planejamentos, setPlanejamentos] = useState<PlanejamentoOpcao[]>([]);
  const [clientesStory, setClientesStory] = useState<ClienteStory[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPlataforma, setFiltroPlataforma] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");

  const [modal, setModal] = useState<Partial<ConteudoLinha> | null | undefined>(undefined);

  const carregar = useCallback(async () => {
    const [resC, resP, resCli] = await Promise.all([
      supabase
        .from("conteudos")
        .select("*, planejamento:planejamentos(id, mes_referencia, cliente:clientes(id, nome))")
        .order("data_publicacao", { ascending: true, nullsFirst: false }),
      supabase
        .from("planejamentos")
        .select("id, mes_referencia, cliente:clientes(id, nome)")
        .eq("status", "ativo")
        .order("mes_referencia", { ascending: false }),
      supabase.from("clientes").select("id, nome, logo_url, cor_primaria").eq("status", "ativo").order("nome"),
    ]);
    setClientesStory((resCli.data ?? []) as ClienteStory[]);

    setCarregando(false);

    if (resC.error) {
      console.error("[conteudos] erro ao carregar:", resC.error);
      setErro("Não foi possível carregar os conteúdos.");
      return;
    }
    setErro("");
    setConteudos((resC.data ?? []) as unknown as ConteudoLinha[]);
    setPlanejamentos((resP.data ?? []) as unknown as PlanejamentoOpcao[]);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function mudarStatus(id: string, status: string) {
    setConteudos((prev) => prev.map((c) => (c.id === id ? { ...c, status: status as Conteudo["status"] } : c)));
    const { error } = await supabase.from("conteudos").update({ status }).eq("id", id);
    if (error) {
      console.error("[conteudos] erro ao mudar status:", error);
      carregar();
    }
  }

  async function excluir(c: ConteudoLinha) {
    if (!confirm(`Excluir o conteúdo "${c.titulo}"?`)) return;
    const { error } = await supabase.from("conteudos").delete().eq("id", c.id);
    if (error) {
      console.error("[conteudos] erro ao excluir:", error);
      setErro("Não foi possível excluir.");
      return;
    }
    setConteudos((prev) => prev.filter((x) => x.id !== c.id));
  }

  // Conteúdos esperando (rascunho/aprovado) por cliente
  const pendentesPorCliente = useMemo(() => {
    const m: Record<string, number> = {};
    conteudos.forEach((c) => {
      const id = c.planejamento?.cliente?.id;
      if (id && (c.status === "rascunho" || c.status === "aprovado")) m[id] = (m[id] ?? 0) + 1;
    });
    return m;
  }, [conteudos]);

  // Clientes com conteúdo primeiro
  const storiesOrdenados = useMemo(() => {
    const comConteudo = new Set(conteudos.map((c) => c.planejamento?.cliente?.id).filter(Boolean) as string[]);
    return [...clientesStory].sort((a, b) =>
      Number(comConteudo.has(b.id)) - Number(comConteudo.has(a.id)) || a.nome.localeCompare(b.nome)
    );
  }, [clientesStory, conteudos]);

  const clientesUnicos = useMemo(() => {
    const mapa = new Map<string, string>();
    conteudos.forEach((c) => {
      const cli = c.planejamento?.cliente;
      if (cli) mapa.set(cli.id, cli.nome);
    });
    return Array.from(mapa, ([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [conteudos]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return conteudos.filter((c) => {
      if (filtroStatus && c.status !== filtroStatus) return false;
      if (filtroPlataforma && c.plataforma !== filtroPlataforma) return false;
      if (filtroCliente && c.planejamento?.cliente?.id !== filtroCliente) return false;
      if (termo) {
        const alvo = `${c.titulo} ${c.legenda ?? ""} ${c.planejamento?.cliente?.nome ?? ""}`.toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      return true;
    });
  }, [conteudos, busca, filtroStatus, filtroPlataforma, filtroCliente]);

  const contagem = useMemo(() => {
    const r: Record<string, number> = {};
    conteudos.forEach((c) => { r[c.status] = (r[c.status] ?? 0) + 1; });
    return r;
  }, [conteudos]);

  return (
    <div>
      <div className="mf-page-header">
        <div>
          <h1 className="mf-page-title">Conteúdos</h1>
          <p className="mf-page-subtitle">Todos os posts e materiais de todos os clientes</p>
        </div>
        <button className="mf-btn-primary" onClick={() => setModal(null)}>
          <Plus size={16} /> Novo conteúdo
        </button>
      </div>

      {/* Clientes estilo stories */}
      {clientesStory.length > 0 && (
        <div className="mf-card" style={{ padding: "0.875rem 0.75rem", marginBottom: "1rem" }}>
          <div className="mf-scroll-x" style={{ display: "flex", gap: "0.5rem", overflowX: "auto", scrollbarWidth: "none" }}>
            <StoryCliente cliente={null} ativo={!filtroCliente} pendentes={0} onClick={() => setFiltroCliente("")} />
            {storiesOrdenados.map((c) => (
              <StoryCliente
                key={c.id}
                cliente={c}
                ativo={filtroCliente === c.id}
                pendentes={pendentesPorCliente[c.id] ?? 0}
                onClick={() => setFiltroCliente(filtroCliente === c.id ? "" : c.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Resumo por status */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {Object.entries(STATUS).map(([v, s]) => {
          const ativo = filtroStatus === v;
          return (
            <button
              key={v}
              onClick={() => setFiltroStatus(ativo ? "" : v)}
              className="mf-stat-card"
              style={{ cursor: "pointer", textAlign: "left", padding: "0.875rem 1rem", borderColor: ativo ? "var(--mf-laranja)" : undefined, boxShadow: ativo ? "0 0 0 3px rgba(255,106,0,0.12)" : undefined }}
            >
              <span className="mf-stat-value" style={{ fontSize: "1.375rem" }}>{contagem[v] ?? 0}</span>
              <span className="mf-stat-label">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="mf-card" style={{ padding: "0.875rem", marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--mf-texto-desab)", pointerEvents: "none" }} />
          <input className="mf-input" style={{ paddingLeft: 36 }} placeholder="Buscar por título, legenda ou cliente..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <select className="mf-input" style={{ flex: "0 1 180px" }} value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)}>
          <option value="">Todos os clientes</option>
          {(clientesStory.length ? clientesStory : clientesUnicos).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <select className="mf-input" style={{ flex: "0 1 160px" }} value={filtroPlataforma} onChange={(e) => setFiltroPlataforma(e.target.value)}>
          <option value="">Todas as plataformas</option>
          {PLATAFORMAS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className="mf-input" style={{ flex: "0 1 150px" }} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
        </select>
      </div>

      {erro && (
        <div style={{ background: "var(--mf-vermelho-bg)", color: "var(--mf-vermelho)", borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.875rem", marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <AlertCircle size={16} /> {erro}
        </div>
      )}

      {/* Lista */}
      {carregando ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><div className="mf-spinner" /></div>
      ) : filtrados.length === 0 ? (
        <div className="mf-card mf-empty">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem", color: "var(--mf-texto-desab)" }}><LayoutGrid size={32} /></div>
          <div className="mf-empty-title">
            {conteudos.length === 0 ? "Nenhum conteúdo cadastrado" : "Nenhum conteúdo encontrado"}
          </div>
          <p style={{ fontSize: "0.875rem", margin: 0 }}>
            {conteudos.length === 0 ? "Crie conteúdos aqui ou dentro de um planejamento." : "Ajuste os filtros para ver mais resultados."}
          </p>
        </div>
      ) : (
        <div className="mf-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="mf-table">
              <thead>
                <tr>
                  <th>Conteúdo</th>
                  <th>Cliente</th>
                  <th>Plataforma</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => (
                  <tr key={c.id}>
                    <td style={{ maxWidth: 320 }}>
                      <div style={{ fontWeight: 600, color: "var(--mf-texto)" }}>{c.titulo}</div>
                      {c.legenda && (
                        <div style={{ fontSize: "0.75rem", color: "var(--mf-texto-sec)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.legenda}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: "0.8125rem" }}>{c.planejamento?.cliente?.nome ?? "—"}</div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--mf-texto-desab)" }}>{mesFmt(c.planejamento?.mes_referencia)}</div>
                    </td>
                    <td>
                      <span className="mf-badge mf-badge-laranja">{c.plataforma}</span>
                      <div style={{ fontSize: "0.6875rem", color: "var(--mf-texto-sec)", marginTop: 2 }}>{c.formato}</div>
                    </td>
                    <td style={{ whiteSpace: "nowrap", fontSize: "0.8125rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <CalendarDays size={13} style={{ color: "var(--mf-texto-desab)" }} />
                        {dataFmt(c.data_publicacao)}
                      </span>
                    </td>
                    <td>
                      <select
                        value={c.status}
                        onChange={(e) => mudarStatus(c.id, e.target.value)}
                        className={STATUS[c.status]?.cls ?? "mf-badge mf-badge-cinza"}
                        style={{ border: "none", cursor: "pointer", outline: "none", appearance: "none", paddingRight: "0.625rem" }}
                        aria-label="Mudar status"
                      >
                        {Object.entries(STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                        <button title="Editar" onClick={() => setModal(c)} style={{ border: "none", background: "none", padding: 6, cursor: "pointer", color: "var(--mf-texto-sec)", borderRadius: 6 }}>
                          <Pencil size={14} />
                        </button>
                        <Link title="Abrir planejamento" href="/planejamento" style={{ padding: 6, color: "var(--mf-texto-sec)", display: "inline-flex" }}>
                          <ExternalLink size={14} />
                        </Link>
                        <button title="Excluir" onClick={() => excluir(c)} style={{ border: "none", background: "none", padding: 6, cursor: "pointer", color: "var(--mf-vermelho)", borderRadius: 6 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal !== undefined && (
        <ModalConteudo
          conteudo={modal}
          planejamentos={planejamentos}
          onClose={() => setModal(undefined)}
          onSave={() => { setModal(undefined); carregar(); }}
        />
      )}
    </div>
  );
}

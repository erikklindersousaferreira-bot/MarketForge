"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { EditorPlanoIA, type PlanoParaEditor } from "@/components/planejamento/EditorPlanoIA";
import { STATUS_APROVACAO, type StatusAprovacao } from "@/lib/planejamento-tipos";
import { supabase } from "@/lib/supabase";
import type { Planejamento, Conteudo, Cliente } from "@/lib/types";

// ── Ícones ───────────────────────────────────────────────────
function IconPlus() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function IconSpark() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>;
}
function IconEdit() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function IconTrash() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}
function IconX() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function IconChevronDown() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
}
function IconChevronRight() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}
function IconCopy() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
}

// ── Helpers ──────────────────────────────────────────────────
function dataFmt(iso: string | null | undefined) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ── Badges ───────────────────────────────────────────────────
function StatusConteudo({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    rascunho:   { label: "Rascunho",   cls: "mf-badge mf-badge-cinza"    },
    aprovado:   { label: "Aprovado",   cls: "mf-badge mf-badge-azul"     },
    publicado:  { label: "Publicado",  cls: "mf-badge mf-badge-verde"    },
    cancelado:  { label: "Cancelado",  cls: "mf-badge mf-badge-vermelho" },
    agendado:   { label: "Agendado",   cls: "mf-badge mf-badge-amarelo"  },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "mf-badge mf-badge-cinza" };
  return <span className={cls}>{label}</span>;
}

const PLATAFORMAS = ["Instagram", "Facebook", "TikTok", "YouTube", "LinkedIn", "WhatsApp", "Site", "Outro"];
const FORMATOS    = ["Feed", "Stories", "Reels", "Carrossel", "Vídeo", "Blog", "E-mail", "Outro"];

// ── Modal Conteúdo ────────────────────────────────────────────
interface ModalConteudoProps {
  conteudo: Partial<Conteudo> | null;
  planejamentoId: string;
  onClose: () => void;
  onSave: () => void;
}

function ModalConteudo({ conteudo, planejamentoId, onClose, onSave }: ModalConteudoProps) {
  const isEdicao = !!conteudo?.id;

  const [form, setForm] = useState({
    titulo:          conteudo?.titulo        ?? "",
    plataforma:      conteudo?.plataforma    ?? "Instagram",
    formato:         conteudo?.formato       ?? "Feed",
    status:          conteudo?.status        ?? "rascunho",
    data_publicacao: conteudo?.data_publicacao ?? "",
    legenda:         conteudo?.legenda       ?? "",
    hashtags:        conteudo?.hashtags      ?? "",
    responsavel:     conteudo?.responsavel   ?? "",
    observacoes:     conteudo?.observacoes   ?? "",
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
      planejamento_id: planejamentoId,
      titulo:          form.titulo.trim(),
      plataforma:      form.plataforma,
      formato:         form.formato,
      status:          form.status,
      data_publicacao: form.data_publicacao || null,
      legenda:         form.legenda.trim()  || null,
      hashtags:        form.hashtags.trim() || null,
      responsavel:     form.responsavel.trim() || null,
      observacoes:     form.observacoes.trim() || null,
    };

    const { error } = isEdicao
      ? await supabase.from("conteudos").update(payload).eq("id", conteudo!.id!)
      : await supabase.from("conteudos").insert(payload);

    if (error) { setErro("Erro ao salvar. Tente novamente."); setSalvando(false); return; }
    onSave();
  }

  return (
    <div className="mf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mf-modal" style={{ maxWidth: 580 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--mf-borda)" }}>
          <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700 }}>
            {isEdicao ? "Editar conteúdo" : "Novo conteúdo"}
          </h2>
          <button onClick={onClose} style={{ padding: "0.25rem", border: "none", background: "none", color: "var(--mf-texto-sec)", cursor: "pointer", borderRadius: 4 }}><IconX /></button>
        </div>

        <form onSubmit={handleSalvar} style={{ padding: "1.5rem" }}>
          <div style={{ marginBottom: "0.875rem" }}>
            <label className="mf-label">Título *</label>
            <input type="text" className="mf-input" placeholder="Ex: Post do Dia dos Pais" value={form.titulo} onChange={e => set("titulo", e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Plataforma</label>
              <select className="mf-input" value={form.plataforma} onChange={e => set("plataforma", e.target.value)}>
                {PLATAFORMAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Formato</label>
              <select className="mf-input" value={form.formato} onChange={e => set("formato", e.target.value)}>
                {FORMATOS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Status</label>
              <select className="mf-input" value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="rascunho">Rascunho</option>
                <option value="aprovado">Aprovado</option>
                <option value="agendado">Agendado</option>
                <option value="publicado">Publicado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Data de publicação</label>
              <input type="date" className="mf-input" value={form.data_publicacao} onChange={e => set("data_publicacao", e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: "0.875rem" }}>
            <label className="mf-label">Legenda / Texto</label>
            <textarea className="mf-input" rows={4} placeholder="Texto do post..." value={form.legenda} onChange={e => set("legenda", e.target.value)} style={{ resize: "vertical" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Hashtags</label>
              <input type="text" className="mf-input" placeholder="#marketing #marabá" value={form.hashtags} onChange={e => set("hashtags", e.target.value)} />
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Responsável</label>
              <input type="text" className="mf-input" placeholder="Nome do responsável" value={form.responsavel} onChange={e => set("responsavel", e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="mf-label">Observações</label>
            <textarea className="mf-input" rows={2} placeholder="Referências, links, notas..." value={form.observacoes} onChange={e => set("observacoes", e.target.value)} style={{ resize: "vertical" }} />
          </div>

          {erro && (
            <div style={{ background: "#FEF2F2", color: "var(--mf-vermelho)", border: "1px solid #FECACA", borderRadius: 8, padding: "0.75rem", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {erro}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
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

// ── Modal Novo Planejamento ───────────────────────────────────
interface ModalPlanejamentoProps {
  clientes: Pick<Cliente, "id" | "nome">[];
  onClose: () => void;
  onSave: () => void;
}

function ModalNovoPlanejamento({ clientes, onClose, onSave }: ModalPlanejamentoProps) {
  const [form, setForm] = useState({
    cliente_id: "",
    mes_referencia: new Date().toISOString().slice(0, 7), // YYYY-MM
    objetivo: "",
    publico_alvo: "",
    tom_voz: "",
    observacoes: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");

  function set(campo: string, valor: string) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id) { setErro("Selecione o cliente."); return; }
    if (!form.mes_referencia) { setErro("Mês de referência obrigatório."); return; }
    setSalvando(true); setErro("");

    const { error } = await supabase.from("planejamentos").insert({
      cliente_id:     form.cliente_id,
      mes_referencia: form.mes_referencia + "-01",
      objetivo:       form.objetivo.trim()     || null,
      publico_alvo:   form.publico_alvo.trim() || null,
      tom_voz:        form.tom_voz.trim()      || null,
      observacoes:    form.observacoes.trim()  || null,
      status:         "ativo",
    });

    if (error) { setErro("Erro ao criar planejamento."); setSalvando(false); return; }
    onSave();
  }

  const meses = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() + i - 2);
    return d.toISOString().slice(0, 7);
  });

  return (
    <div className="mf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mf-modal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--mf-borda)" }}>
          <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700 }}>Novo planejamento</h2>
          <button onClick={onClose} style={{ padding: "0.25rem", border: "none", background: "none", color: "var(--mf-texto-sec)", cursor: "pointer", borderRadius: 4 }}><IconX /></button>
        </div>

        <form onSubmit={handleSalvar} style={{ padding: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            <div style={{ marginBottom: "0.875rem", gridColumn: "1 / -1" }}>
              <label className="mf-label">Cliente *</label>
              <select className="mf-input" value={form.cliente_id} onChange={e => set("cliente_id", e.target.value)}>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Mês de referência *</label>
              <select className="mf-input" value={form.mes_referencia} onChange={e => set("mes_referencia", e.target.value)}>
                {meses.map(m => {
                  const [y, mo] = m.split("-");
                  const nome = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
                  return <option key={m} value={m}>{nome.charAt(0).toUpperCase() + nome.slice(1)}</option>;
                })}
              </select>
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="mf-label">Tom de voz</label>
              <input type="text" className="mf-input" placeholder="Ex: Descontraído, profissional..." value={form.tom_voz} onChange={e => set("tom_voz", e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: "0.875rem" }}>
            <label className="mf-label">Objetivo do mês</label>
            <input type="text" className="mf-input" placeholder="Ex: Aumentar engajamento 20%, lançar produto X..." value={form.objetivo} onChange={e => set("objetivo", e.target.value)} />
          </div>

          <div style={{ marginBottom: "0.875rem" }}>
            <label className="mf-label">Público-alvo</label>
            <input type="text" className="mf-input" placeholder="Ex: Mulheres 25-40 anos, interior do Pará..." value={form.publico_alvo} onChange={e => set("publico_alvo", e.target.value)} />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="mf-label">Observações</label>
            <textarea className="mf-input" rows={2} placeholder="Datas especiais, campanhas, restrições..." value={form.observacoes} onChange={e => set("observacoes", e.target.value)} style={{ resize: "vertical" }} />
          </div>

          {erro && (
            <div style={{ background: "#FEF2F2", color: "var(--mf-vermelho)", border: "1px solid #FECACA", borderRadius: 8, padding: "0.75rem", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {erro}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button type="button" className="mf-btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="mf-btn-primary" disabled={salvando}>
              {salvando ? "Criando..." : "Criar planejamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Painel de IA ──────────────────────────────────────────────
interface PainelIAProps {
  planejamento: Planejamento & { cliente?: { nome: string } };
  onConteudosCriados: () => void;
}

function PainelIA({ planejamento, onConteudosCriados }: PainelIAProps) {
  const [prompt,    setPrompt]    = useState("");
  const [resposta,  setResposta]  = useState("");
  const [gerando,   setGerando]   = useState(false);
  const [erro,      setErro]      = useState("");
  const [copiado,   setCopiado]   = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const promptBase = `Cliente: ${(planejamento.cliente as unknown as { nome: string } | null)?.nome ?? ""}
Objetivo: ${planejamento.objetivo ?? "Aumentar engajamento e visibilidade"}
Público-alvo: ${planejamento.publico_alvo ?? "Público geral"}
Tom de voz: ${planejamento.tom_voz ?? "Profissional e acolhedor"}
Mês de referência: ${planejamento.mes_referencia ? new Date(planejamento.mes_referencia + "T12:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : ""}`;

  async function handleGerar(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) { setErro("Digite uma instrução para a IA."); return; }
    setGerando(true); setErro(""); setResposta("");

    try {
      const res = await fetch("/api/ia/planejamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planejamento_id: planejamento.id,
          contexto: promptBase,
          instrucao: prompt.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErro(data.error ?? "Erro ao gerar conteúdo.");
        setGerando(false);
        return;
      }

      // Streaming
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let textoCompleto = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          textoCompleto += chunk;
          setResposta(textoCompleto);
        }
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    }

    setGerando(false);
  }

  async function handleCopiar() {
    await navigator.clipboard.writeText(resposta);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const sugestoes = [
    "Crie 10 ideias de posts para o mês com tema, plataforma e legenda",
    "Sugira 5 Reels criativos com roteiro resumido",
    "Crie uma série de Stories para engajamento",
    "Sugira posts para datas comemorativas do mês",
  ];

  return (
    <div className="mf-card" style={{ marginTop: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #FF6A00, #FF9A3C)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconSpark />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Assistente de Conteúdo IA</div>
          <div style={{ fontSize: "0.75rem", color: "var(--mf-texto-sec)" }}>Contexto do planejamento carregado</div>
        </div>
      </div>

      {/* Contexto */}
      <div style={{ background: "var(--mf-fundo)", borderRadius: 8, padding: "0.75rem", fontSize: "0.8125rem", color: "var(--mf-texto-sec)", marginBottom: "1rem", whiteSpace: "pre-wrap", border: "1px solid var(--mf-borda)" }}>
        {promptBase}
      </div>

      {/* Sugestões rápidas */}
      <div style={{ marginBottom: "0.875rem" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--mf-texto-sec)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sugestões rápidas</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
          {sugestoes.map(s => (
            <button
              key={s}
              onClick={() => setPrompt(s)}
              style={{
                padding: "0.25rem 0.75rem", borderRadius: 999, border: "1px solid var(--mf-borda)",
                fontSize: "0.75rem", cursor: "pointer", background: "white",
                color: "var(--mf-texto-sec)", transition: "all 150ms",
              }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = "#FF6A00"; (e.target as HTMLButtonElement).style.color = "#FF6A00"; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = "var(--mf-borda)"; (e.target as HTMLButtonElement).style.color = "var(--mf-texto-sec)"; }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleGerar}>
        <div style={{ position: "relative" }}>
          <textarea
            ref={textareaRef}
            className="mf-input"
            rows={3}
            placeholder="Ex: Crie 10 ideias de post para Instagram com legenda e hashtags..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            style={{ resize: "none", paddingRight: "7rem" }}
          />
          <button
            type="submit"
            className="mf-btn-primary"
            disabled={gerando || !prompt.trim()}
            style={{ position: "absolute", right: "0.5rem", bottom: "0.5rem", padding: "0.375rem 0.875rem", fontSize: "0.8125rem" }}
          >
            {gerando ? "Gerando..." : <><IconSpark /> Gerar</>}
          </button>
        </div>
      </form>

      {erro && (
        <div style={{ background: "#FEF2F2", color: "var(--mf-vermelho)", border: "1px solid #FECACA", borderRadius: 8, padding: "0.75rem", fontSize: "0.875rem", marginTop: "0.75rem" }}>
          {erro}
        </div>
      )}

      {/* Resposta */}
      {(resposta || gerando) && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--mf-texto-sec)" }}>Resposta da IA</div>
            {resposta && (
              <button
                onClick={handleCopiar}
                style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.25rem 0.625rem", border: "1px solid var(--mf-borda)", borderRadius: 6, background: "white", fontSize: "0.75rem", cursor: "pointer", color: "var(--mf-texto-sec)" }}
              >
                <IconCopy /> {copiado ? "Copiado!" : "Copiar"}
              </button>
            )}
          </div>
          <div style={{
            background: "var(--mf-fundo)", borderRadius: 8, padding: "1rem",
            fontSize: "0.875rem", lineHeight: 1.7, whiteSpace: "pre-wrap",
            border: "1px solid var(--mf-borda)", minHeight: 80,
            color: gerando && !resposta ? "var(--mf-texto-sec)" : "var(--mf-texto)",
          }}>
            {gerando && !resposta ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div className="mf-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                <span>Gerando conteúdo...</span>
              </div>
            ) : resposta}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card de Planejamento ──────────────────────────────────────
interface CardPlanejamentoProps {
  plan: Planejamento & { cliente?: { nome: string; logo_url?: string | null }; conteudos?: Conteudo[] } & Partial<PlanoParaEditor>;
  onRefresh: () => void;
}

function CardPlanejamento({ plan, onRefresh }: CardPlanejamentoProps) {
  const [expandido,     setExpandido]     = useState(false);
  const [mostrarIA,     setMostrarIA]     = useState(false);
  const [modalConteudo, setModalConteudo] = useState(false);
  const [editandoCont,  setEditandoCont]  = useState<Partial<Conteudo> | null>(null);
  const [deletandoCont, setDeletandoCont] = useState<string | null>(null);
  const [confirmarExcluir, setConfirmarExcluir] = useState(false);
  const [excluindoPlan,    setExcluindoPlan]    = useState(false);
  const [erroExcluir,      setErroExcluir]      = useState("");

  const conteudos = plan.conteudos ?? [];
  const clienteNome = (plan.cliente as unknown as { nome: string } | null)?.nome ?? "—";
  const clienteLogo = (plan.cliente as unknown as { logo_url?: string | null } | null)?.logo_url ?? null;
  const statusAprov = STATUS_APROVACAO[(plan.status_aprovacao ?? "rascunho") as StatusAprovacao] ?? STATUS_APROVACAO.rascunho;

  const mesLabel = plan.mes_referencia
    ? new Date(plan.mes_referencia + "T12:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "—";

  const contagem = {
    total:      conteudos.length,
    publicado:  conteudos.filter(c => c.status === "publicado").length,
    aprovado:   conteudos.filter(c => c.status === "aprovado").length,
    rascunho:   conteudos.filter(c => c.status === "rascunho").length,
  };

  async function handleExcluirPlanejamento() {
    setExcluindoPlan(true);
    setErroExcluir("");
    // Os conteúdos do planejamento vão junto
    const { error: errCont } = await supabase.from("conteudos").delete().eq("planejamento_id", plan.id);
    if (!errCont) {
      const { error } = await supabase.from("planejamentos").delete().eq("id", plan.id);
      if (!error) {
        setConfirmarExcluir(false);
        setExcluindoPlan(false);
        onRefresh();
        return;
      }
      console.error("[planejamento] erro ao excluir:", error);
    } else {
      console.error("[planejamento] erro ao excluir conteúdos:", errCont);
    }
    setErroExcluir("Não foi possível excluir. Tente novamente.");
    setExcluindoPlan(false);
  }

  async function handleDeleteConteudo(id: string) {
    await supabase.from("conteudos").delete().eq("id", id);
    setDeletandoCont(null);
    onRefresh();
  }

  return (
    <div className="mf-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header do card */}
      <div
        style={{ padding: "1rem 1.25rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "space-between" }}
        onClick={() => setExpandido(e => !e)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
          <div style={{ color: expandido ? "var(--mf-laranja)" : "var(--mf-texto-sec)", flexShrink: 0 }}>
            {expandido ? <IconChevronDown /> : <IconChevronRight />}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "0.9375rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {clienteNome}
              <span style={{ fontWeight: 400, color: "var(--mf-texto-sec)", marginLeft: "0.5rem", fontSize: "0.875rem" }}>
                · {mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)}
              </span>
            </div>
            {plan.objetivo && (
              <div style={{ fontSize: "0.8125rem", color: "var(--mf-texto-sec)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {plan.objetivo}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          {/* Contadores */}
          <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.75rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {(plan.estrutura || plan.status_aprovacao !== "rascunho") && <span className={statusAprov.cls}>{statusAprov.label}</span>}
            <span className="mf-badge mf-badge-verde">{contagem.publicado} pub.</span>
            <span className="mf-badge mf-badge-azul">{contagem.aprovado} aprov.</span>
            <span className="mf-badge mf-badge-cinza">{contagem.rascunho} rascunho</span>
          </div>
        </div>
      </div>

      {/* Conteúdo expandido */}
      {expandido && (
        <div style={{ borderTop: "1px solid var(--mf-borda)" }}>
          {/* Planejamento visual para o cliente (IA) */}
          <EditorPlanoIA
            plan={plan as unknown as PlanoParaEditor}
            clienteNome={clienteNome}
            clienteLogo={clienteLogo}
            onRefresh={onRefresh}
          />

          {/* Ações */}
          <div style={{ padding: "0.75rem 1.25rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", background: "var(--mf-fundo)", borderBottom: "1px solid var(--mf-borda)" }}>
            <button
              className="mf-btn-primary"
              onClick={() => { setEditandoCont(null); setModalConteudo(true); }}
              style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}
            >
              <IconPlus /> Novo conteúdo
            </button>
            <button
              className="mf-btn-secondary"
              onClick={() => setMostrarIA(v => !v)}
              style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem", display: "flex", alignItems: "center", gap: "0.375rem", borderColor: mostrarIA ? "var(--mf-laranja)" : undefined, color: mostrarIA ? "var(--mf-laranja)" : undefined }}
            >
              <IconSpark /> {mostrarIA ? "Fechar IA" : "Assistente IA"}
            </button>
            <button
              className="mf-btn-secondary"
              onClick={() => setConfirmarExcluir(true)}
              style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem", display: "flex", alignItems: "center", gap: "0.375rem", color: "var(--mf-vermelho)", marginLeft: "auto" }}
            >
              <IconTrash /> Excluir planejamento
            </button>
          </div>

          {/* Painel IA */}
          {mostrarIA && (
            <div style={{ padding: "0 1.25rem", borderBottom: "1px solid var(--mf-borda)" }}>
              <PainelIA planejamento={plan} onConteudosCriados={onRefresh} />
            </div>
          )}

          {/* Lista de conteúdos */}
          {conteudos.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--mf-texto-sec)", fontSize: "0.875rem" }}>
              Nenhum conteúdo cadastrado. Crie um manualmente ou use o Assistente IA.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="mf-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Plataforma</th>
                    <th>Formato</th>
                    <th>Publicação</th>
                    <th>Status</th>
                    <th style={{ width: 80, textAlign: "center" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {conteudos.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{c.titulo}</div>
                        {c.legenda && (
                          <div style={{ fontSize: "0.75rem", color: "var(--mf-texto-sec)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.legenda}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: "0.875rem", color: "var(--mf-texto-sec)" }}>{c.plataforma}</td>
                      <td style={{ fontSize: "0.875rem", color: "var(--mf-texto-sec)" }}>{c.formato}</td>
                      <td style={{ fontSize: "0.875rem", color: "var(--mf-texto-sec)" }}>{dataFmt(c.data_publicacao)}</td>
                      <td><StatusConteudo status={c.status} /></td>
                      <td>
                        <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                          <button
                            style={{ padding: "0.3rem", border: "none", background: "none", color: "var(--mf-texto-sec)", cursor: "pointer", borderRadius: 4 }}
                            onClick={() => { setEditandoCont(c); setModalConteudo(true); }}
                            title="Editar"
                          >
                            <IconEdit />
                          </button>
                          <button
                            style={{ padding: "0.3rem", border: "none", background: "none", color: "var(--mf-vermelho)", cursor: "pointer", borderRadius: 4 }}
                            onClick={() => setDeletandoCont(c.id)}
                            title="Excluir"
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
      )}

      {/* Modal conteúdo */}
      {modalConteudo && (
        <ModalConteudo
          conteudo={editandoCont}
          planejamentoId={plan.id}
          onClose={() => { setModalConteudo(false); setEditandoCont(null); }}
          onSave={() => { setModalConteudo(false); setEditandoCont(null); onRefresh(); }}
        />
      )}

      {/* Confirmação exclusão conteúdo */}
      {deletandoCont && (
        <div className="mf-overlay">
          <div className="mf-modal" style={{ maxWidth: 400 }}>
            <div style={{ padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 700 }}>Excluir conteúdo?</h3>
              <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "var(--mf-texto-sec)" }}>Esta ação não pode ser desfeita.</p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button className="mf-btn-secondary" onClick={() => setDeletandoCont(null)}>Cancelar</button>
                <button className="mf-btn-primary" style={{ background: "var(--mf-vermelho)" }} onClick={() => handleDeleteConteudo(deletandoCont)}>Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {confirmarExcluir && (
        <div className="mf-overlay" onClick={e => e.target === e.currentTarget && !excluindoPlan && setConfirmarExcluir(false)}>
          <div className="mf-modal" style={{ maxWidth: 420, padding: "1.5rem" }}>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.0625rem", fontWeight: 700 }}>Excluir planejamento?</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--mf-texto-sec)", margin: "0 0 1rem" }}>
              O planejamento de <strong style={{ color: "var(--mf-texto)" }}>{clienteNome} · {mesLabel}</strong>
              {conteudos.length > 0 ? ` e os ${conteudos.length} conteúdo${conteudos.length !== 1 ? "s" : ""} dele` : ""} serão apagados.
              {" "}<strong>Isso não pode ser desfeito.</strong>
            </p>
            {erroExcluir && (
              <div style={{ background: "var(--mf-vermelho-bg)", color: "var(--mf-vermelho)", borderRadius: 8, padding: "0.625rem 0.875rem", fontSize: "0.8125rem", marginBottom: "1rem" }}>{erroExcluir}</div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button className="mf-btn-secondary" onClick={() => setConfirmarExcluir(false)} disabled={excluindoPlan}>Cancelar</button>
              <button className="mf-btn-primary" onClick={handleExcluirPlanejamento} disabled={excluindoPlan} style={{ background: "var(--mf-vermelho)" }}>
                {excluindoPlan ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────
export default function PlanejamentoPage() {

  const [planejamentos, setPlanejamentos] = useState<(Planejamento & { cliente?: { nome: string }; conteudos?: Conteudo[] })[]>([]);
  const [clientes,      setClientes]      = useState<Pick<Cliente, "id" | "nome">[]>([]);
  const [carregando,    setCarregando]    = useState(true);
  const [modalNovo,     setModalNovo]     = useState(false);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [busca,         setBusca]         = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data } = await supabase
      .from("planejamentos")
      .select("*, cliente:cliente_id(id, nome, logo_url), conteudos(*)")
      .order("mes_referencia", { ascending: false });
    if (data) setPlanejamentos(data as typeof planejamentos);
    setCarregando(false);
  }, [supabase]);

  useEffect(() => {
    carregar();
    supabase.from("clientes").select("id, nome").eq("status", "ativo").order("nome")
      .then(({ data }) => { if (data) setClientes(data); });
  }, [carregar, supabase]);

  const filtrados = planejamentos.filter(p => {
    const clienteNome = (p.cliente as unknown as { nome: string } | null)?.nome ?? "";
    const matchCliente = !filtroCliente || p.cliente_id === filtroCliente;
    const matchBusca   = !busca || clienteNome.toLowerCase().includes(busca.toLowerCase()) || (p.objetivo ?? "").toLowerCase().includes(busca.toLowerCase());
    return matchCliente && matchBusca;
  });

  const totalConteudos = planejamentos.reduce((acc, p) => acc + (p.conteudos?.length ?? 0), 0);
  const totalPublicados = planejamentos.reduce((acc, p) => acc + (p.conteudos?.filter(c => c.status === "publicado").length ?? 0), 0);

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mf-page-header">
        <div>
          <h1 className="mf-page-title">Planejamento de Conteúdo</h1>
          <p className="mf-page-subtitle">{planejamentos.length} planejamento{planejamentos.length !== 1 ? "s" : ""} · {totalConteudos} conteúdos · {totalPublicados} publicados</p>
        </div>
        <button className="mf-btn-primary" onClick={() => setModalNovo(true)} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <IconPlus /> Novo planejamento
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          className="mf-input"
          placeholder="Buscar por cliente ou objetivo..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ flex: "1 1 200px", maxWidth: 320 }}
        />
        <select className="mf-input" style={{ width: "auto" }} value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}>
          <option value="">Todos os clientes</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {/* Lista */}
      {carregando ? (
        <div style={{ padding: "3rem", textAlign: "center" }}><div className="mf-spinner" style={{ margin: "0 auto" }} /></div>
      ) : filtrados.length === 0 ? (
        <div className="mf-card">
          <div className="mf-empty">
            <div className="mf-empty-icon">📅</div>
            <div className="mf-empty-title">{busca || filtroCliente ? "Nenhum planejamento encontrado" : "Nenhum planejamento ainda"}</div>
            <p style={{ fontSize: "0.875rem", margin: "0.25rem 0 1rem", color: "var(--mf-texto-sec)" }}>
              {busca || filtroCliente ? "Tente ajustar os filtros." : "Crie o primeiro planejamento de conteúdo."}
            </p>
            {!busca && !filtroCliente && (
              <button className="mf-btn-primary" onClick={() => setModalNovo(true)} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                <IconPlus /> Novo planejamento
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtrados.map(p => (
            <CardPlanejamento key={p.id} plan={p} onRefresh={carregar} />
          ))}
        </div>
      )}

      {/* Modal novo planejamento */}
      {modalNovo && (
        <ModalNovoPlanejamento
          clientes={clientes}
          onClose={() => setModalNovo(false)}
          onSave={() => { setModalNovo(false); carregar(); }}
        />
      )}
    </div>
  );
}

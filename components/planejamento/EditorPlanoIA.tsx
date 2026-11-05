"use client";

// components/planejamento/EditorPlanoIA.tsx
// Dentro do card de Planejamento: texto do mês → IA monta o visual → ajustes → enviar ao cliente.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { PlanoVisual } from "./PlanoVisual";
import { STATUS_APROVACAO, mesPorExtenso, type EstruturaPlanejamento, type StatusAprovacao } from "@/lib/planejamento-tipos";

export type PlanoParaEditor = {
  id: string;
  cliente_id: string;
  mes_referencia: string;
  texto_base?: string | null;
  estrutura?: EstruturaPlanejamento | null;
  status_aprovacao?: StatusAprovacao | null;
  comentario_cliente?: string | null;
  enviado_em?: string | null;
  aprovado_cliente_em?: string | null;
};

type Props = {
  plan: PlanoParaEditor;
  clienteNome: string;
  clienteLogo?: string | null;
  onRefresh: () => void;
};

const PLATAFORMAS_OK = ["Instagram", "Facebook", "TikTok", "YouTube", "LinkedIn", "WhatsApp", "Site", "Outro"];

export function EditorPlanoIA({ plan, clienteNome, clienteLogo, onRefresh }: Props) {
  const [texto, setTexto] = useState(plan.texto_base ?? "");
  const [estrutura, setEstrutura] = useState<EstruturaPlanejamento | null>(plan.estrutura ?? null);
  const [status, setStatus] = useState<StatusAprovacao>((plan.status_aprovacao as StatusAprovacao) ?? "rascunho");
  const [ajuste, setAjuste] = useState("");
  const [gerando, setGerando] = useState<"" | "gerar" | "ajustar">("");
  const [enviando, setEnviando] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);
  const [mostrarTexto, setMostrarTexto] = useState(!plan.estrutura);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  const mesLabel = mesPorExtenso(plan.mes_referencia);
  const st = STATUS_APROVACAO[status] ?? STATUS_APROVACAO.rascunho;

  async function chamarIA(modo: "gerar" | "ajustar") {
    setErro(""); setOk(""); setGerando(modo);
    try {
      const res = await fetch("/api/ia/planejamento-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modo === "gerar" ? { planejamento_id: plan.id, texto } : { planejamento_id: plan.id, ajuste }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErro(data.error ?? "Erro ao gerar."); return; }
      setEstrutura(data.estrutura);
      setStatus("rascunho");
      setMostrarTexto(false);
      if (modo === "ajustar") setAjuste("");
      setOk(modo === "gerar" ? "Planejamento montado! Revise abaixo." : "Ajuste aplicado.");
    } finally {
      setGerando("");
    }
  }

  async function enviarAoCliente() {
    if (!estrutura) return;
    if (!confirm(`Aprovar e enviar o planejamento de ${mesLabel} para ${clienteNome}? Os vídeos/posts com data vão para Conteúdos.`)) return;
    setEnviando(true); setErro(""); setOk("");

    // Recria os conteúdos gerados pela IA que ainda não andaram (rascunho)
    await supabase.from("conteudos").delete().eq("planejamento_id", plan.id).eq("gerado_ia", true).eq("status", "rascunho");

    const novos = (estrutura.conteudos ?? [])
      .filter((c) => c.titulo?.trim())
      .map((c) => ({
        planejamento_id: plan.id,
        titulo: c.titulo.trim().slice(0, 200),
        plataforma: PLATAFORMAS_OK.includes(c.plataforma ?? "") ? c.plataforma : "Instagram",
        formato: c.formato?.trim() || "Reels",
        status: "rascunho",
        data_publicacao: c.data && /^\d{4}-\d{2}-\d{2}$/.test(c.data) ? c.data : null,
        legenda: c.legenda?.trim() || null,
        gerado_ia: true,
      }));
    if (novos.length) {
      const { error: errC } = await supabase.from("conteudos").insert(novos);
      if (errC) {
        console.error("[enviar plano] conteúdos:", errC);
        setErro("Não foi possível criar os conteúdos. Rode a etapa 12 do banco e tente de novo.");
        setEnviando(false);
        return;
      }
    }

    const { error } = await supabase.from("planejamentos").update({
      status_aprovacao: "enviado",
      enviado_em: new Date().toISOString(),
      comentario_cliente: null,
      aprovado_cliente_em: null,
    }).eq("id", plan.id);

    setEnviando(false);
    if (error) { setErro("Não foi possível enviar. Tente novamente."); return; }
    setStatus("enviado");
    setOk(`Enviado! ${novos.length} conteúdo${novos.length !== 1 ? "s" : ""} criado${novos.length !== 1 ? "s" : ""} em Conteúdos. O cliente já vê no portal.`);
    onRefresh();
  }

  return (
    <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--mf-borda)", background: "#FFFCF9" }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>📋 Planejamento do mês para o cliente</div>
          <div style={{ fontSize: "0.75rem", color: "var(--mf-texto-sec)" }}>Escreva ou dite o plano → a IA monta a apresentação → você aprova e envia.</div>
        </div>
        <span className={st.cls}>{st.label}</span>
      </div>

      {status === "ajuste" && plan.comentario_cliente && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "0.75rem 0.875rem", fontSize: "0.8125rem", color: "#991B1B", marginBottom: "0.75rem" }}>
          <strong>O cliente pediu:</strong> “{plan.comentario_cliente}”
          <div style={{ marginTop: 4, color: "#B91C1C" }}>Use “Pedir ajuste à IA” abaixo e envie de novo.</div>
        </div>
      )}
      {status === "aprovado" && (
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "0.625rem 0.875rem", fontSize: "0.8125rem", color: "#166534", marginBottom: "0.75rem" }}>
          ✅ Aprovado pelo cliente{plan.aprovado_cliente_em ? ` em ${new Date(plan.aprovado_cliente_em).toLocaleDateString("pt-BR")}` : ""}.
          {plan.comentario_cliente ? ` Comentário: “${plan.comentario_cliente}”` : ""}
        </div>
      )}

      {/* Texto base */}
      {mostrarTexto ? (
        <div style={{ marginBottom: "0.75rem" }}>
          <label className="mf-label">Texto do planejamento do mês</label>
          <textarea
            className="mf-input"
            rows={8}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`Ex.: Este mês o foco é divulgar as programações da noite (karaokê, pagode, mesa da amargura) e mostrar que o ${clienteNome} também é restaurante. Stories todos os dias com a programação, ambiente, comida e movimento. Fim de semana reforçar o almoço. Dia 19/10 vídeo do pagode, depois um vídeo novo a cada 4 dias. Dia 22/10 vídeo da feijoada. Quando o delivery e o cardápio novo estiverem prontos, fazemos fotos, vídeos e tráfego pago...`}
            style={{ resize: "vertical", lineHeight: 1.5 }}
          />
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
            <button className="mf-btn-primary" onClick={() => chamarIA("gerar")} disabled={!!gerando || texto.trim().length < 30}>
              {gerando === "gerar" ? "A IA está montando..." : estrutura ? "✨ Gerar de novo" : "✨ Gerar planejamento com IA"}
            </button>
            {estrutura && (
              <button className="mf-btn-secondary" onClick={() => setMostrarTexto(false)} disabled={!!gerando}>Cancelar</button>
            )}
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--mf-texto-sec)", margin: "0.5rem 0 0" }}>
            Dica: no celular, toque no microfone do teclado para ditar.
          </p>
        </div>
      ) : (
        <button
          onClick={() => setMostrarTexto(true)}
          style={{ border: "none", background: "none", color: "var(--mf-laranja)", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer", padding: 0, marginBottom: "0.75rem" }}
        >
          ✏️ Editar o texto e gerar de novo
        </button>
      )}

      {erro && <div style={{ background: "var(--mf-vermelho-bg)", color: "var(--mf-vermelho)", borderRadius: 8, padding: "0.625rem 0.875rem", fontSize: "0.8125rem", marginBottom: "0.75rem" }}>{erro}</div>}
      {ok && <div style={{ background: "#F0FDF4", color: "#166534", borderRadius: 8, padding: "0.625rem 0.875rem", fontSize: "0.8125rem", marginBottom: "0.75rem" }}>{ok}</div>}

      {/* Prévia */}
      {estrutura && (
        <>
          <div style={{ maxWidth: 520, margin: "0 auto", maxHeight: 640, overflowY: "auto", borderRadius: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
            <PlanoVisual estrutura={estrutura} clienteNome={clienteNome} clienteLogo={clienteLogo} mesLabel={mesLabel} />
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "0.625rem", flexWrap: "wrap", fontSize: "0.8125rem" }}>
            <button onClick={() => setTelaCheia(true)} style={{ border: "none", background: "none", color: "var(--mf-texto-sec)", cursor: "pointer", fontWeight: 600 }}>⛶ Tela cheia</button>
            <a href={`/portal?cliente=${plan.cliente_id}&plano=${plan.id}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--mf-texto-sec)", fontWeight: 600, textDecoration: "none" }}>
              👁 Ver como o cliente vê
            </a>
          </div>

          {/* Ajuste com IA */}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <input
              className="mf-input"
              style={{ flex: "1 1 240px" }}
              value={ajuste}
              onChange={(e) => setAjuste(e.target.value)}
              placeholder="Pedir ajuste à IA. Ex.: troque a data do pagode para 20/10"
              onKeyDown={(e) => { if (e.key === "Enter" && ajuste.trim()) chamarIA("ajustar"); }}
            />
            <button className="mf-btn-secondary" onClick={() => chamarIA("ajustar")} disabled={!!gerando || !ajuste.trim()}>
              {gerando === "ajustar" ? "Ajustando..." : "Ajustar"}
            </button>
          </div>

          {/* Enviar */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button className="mf-btn-primary" onClick={enviarAoCliente} disabled={enviando || !!gerando} style={{ minWidth: 220, justifyContent: "center" }}>
              {enviando ? "Enviando..." : status === "rascunho" ? "✅ Aprovar e enviar ao cliente" : "↻ Reenviar ao cliente"}
            </button>
          </div>
          {(estrutura.conteudos?.length ?? 0) > 0 && (
            <p style={{ fontSize: "0.75rem", color: "var(--mf-texto-sec)", textAlign: "right", margin: "0.375rem 0 0" }}>
              Ao enviar, {estrutura.conteudos!.length} conteúdo{estrutura.conteudos!.length !== 1 ? "s" : ""} vão para a tela Conteúdos.
            </p>
          )}
        </>
      )}

      {telaCheia && estrutura && (
        <div className="mf-overlay" style={{ background: "rgba(0,0,0,0.85)" }} onClick={(e) => e.target === e.currentTarget && setTelaCheia(false)}>
          <div style={{ width: "100%", maxWidth: 860, maxHeight: "94vh", overflowY: "auto", borderRadius: 20, position: "relative" }}>
            <button
              onClick={() => setTelaCheia(false)}
              aria-label="Fechar"
              style={{ position: "sticky", top: 10, float: "right", marginRight: 10, zIndex: 2, width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", fontSize: 18 }}
            >×</button>
            <PlanoVisual estrutura={estrutura} clienteNome={clienteNome} clienteLogo={clienteLogo} mesLabel={mesLabel} />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

// app/portal/page.tsx — Portal do cliente: planejamento do mês, entregas da semana, agenda e financeiro
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PlanoVisual } from "@/components/planejamento/PlanoVisual";
import { mesPorExtenso, type EstruturaPlanejamento, type StatusAprovacao } from "@/lib/planejamento-tipos";

const LARANJA = "#FF6A00";
const WHATSAPP_AGENCIA = "5594991187661";

// ── Tipos ────────────────────────────────────────────────────
type Cliente = { id: string; nome: string; logo_url: string | null; cor_primaria: string | null };
type Plano = {
  id: string; mes_referencia: string; estrutura: EstruturaPlanejamento | null;
  status_aprovacao: StatusAprovacao; comentario_cliente: string | null; aprovado_cliente_em: string | null;
};
type Tarefa = { id: string; titulo: string; status: string; prazo: string | null; prioridade: string | null; concluida_em: string | null; tipo: string | null };
type Evento = { id: string; titulo: string; tipo: string; data_inicio: string; local: string | null };
type Cobranca = { id: string; descricao: string | null; valor: number; vencimento: string | null; status: string };
type Aba = "plano" | "semana" | "agenda" | "financeiro";

// ── Datas ────────────────────────────────────────────────────
function soData(iso: string | null | undefined): string {
  if (!iso) return "";
  if (!iso.includes("T")) return iso.slice(0, 10);
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function hojeISO() { return soData(new Date().toISOString()); }
function semanaAtual(): [string, string] {
  const d = new Date(); const dia = d.getDay(); // 0=dom
  const seg = new Date(d); seg.setDate(d.getDate() - ((dia + 6) % 7));
  const dom = new Date(seg); dom.setDate(seg.getDate() + 6);
  return [soData(seg.toISOString()), soData(dom.toISOString())];
}
function diaCurto(iso: string | null) {
  const s = soData(iso); if (!s) return "Sem data";
  const d = new Date(s + "T12:00");
  const txt = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "");
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}
function brl(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

const STATUS_TAREFA: Record<string, { label: string; cor: string }> = {
  pendente:     { label: "Na fila",       cor: "#A1A1AA" },
  em_andamento: { label: "Em produção",   cor: "#60A5FA" },
  em_revisao:   { label: "Em revisão",    cor: "#FBBF24" },
  concluida:    { label: "Entregue",      cor: "#3DDC84" },
  cancelada:    { label: "Cancelada",     cor: "#71717A" },
};

function iniciais(n: string) { return (n || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase(); }

// ── Página ───────────────────────────────────────────────────
function PortalConteudo() {
  const router = useRouter();
  const params = useSearchParams();
  const clienteParam = params.get("cliente");
  const planoParam = params.get("plano");

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [preview, setPreview] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [planoId, setPlanoId] = useState<string>("");
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [aba, setAba] = useState<Aba>("plano");

  const [folhaAjuste, setFolhaAjuste] = useState(false);
  const [comentario, setComentario] = useState("");
  const [enviandoResp, setEnviandoResp] = useState(false);
  const [msgResp, setMsgResp] = useState("");

  const carregar = useCallback(async () => {
    setErro("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: eu } = await supabase.from("usuarios").select("nome, papel, cliente_id").eq("id", user.id).single();
    const me = eu as { nome: string | null; papel: string; cliente_id: string | null } | null;
    setNomeUsuario(me?.nome ?? "");

    const ehEquipe = me?.papel === "admin" || me?.papel === "equipe";
    const clienteId = ehEquipe ? clienteParam : me?.cliente_id;
    setPreview(ehEquipe);

    if (!clienteId) {
      setCarregando(false);
      setErro(ehEquipe ? "Abra a pré-visualização a partir de um planejamento." : "Seu acesso ainda não foi ligado a uma empresa. Fale com a MarketForge.");
      return;
    }

    const hoje = new Date();
    const limite = new Date(hoje); limite.setDate(hoje.getDate() + 30);

    const statusVisiveis = ehEquipe ? ["rascunho", "enviado", "aprovado", "ajuste"] : ["enviado", "aprovado", "ajuste"];
    const [rCli, rPlan, rTar, rEv, rCob] = await Promise.all([
      supabase.from("clientes").select("id, nome, logo_url, cor_primaria").eq("id", clienteId).single(),
      supabase.from("planejamentos")
        .select("id, mes_referencia, estrutura, status_aprovacao, comentario_cliente, aprovado_cliente_em")
        .eq("cliente_id", clienteId).in("status_aprovacao", statusVisiveis).not("estrutura", "is", null)
        .order("mes_referencia", { ascending: false }).limit(12),
      supabase.from("tarefas").select("id, titulo, status, prazo, prioridade, concluida_em, tipo")
        .eq("cliente_id", clienteId).neq("status", "cancelada").order("prazo", { ascending: true, nullsFirst: false }).limit(200),
      supabase.from("eventos_agenda").select("id, titulo, tipo, data_inicio, local")
        .eq("cliente_id", clienteId).gte("data_inicio", new Date(hoje.toDateString()).toISOString()).lte("data_inicio", limite.toISOString())
        .order("data_inicio").limit(30),
      supabase.from("cobrancas").select("id, descricao, valor, vencimento, status")
        .eq("cliente_id", clienteId).in("status", ["pendente", "atrasado"]).order("vencimento").limit(12),
    ]);

    if (rCli.data) setCliente(rCli.data as Cliente);
    const lista = (rPlan.data ?? []) as Plano[];
    setPlanos(lista);
    setPlanoId((atual) => {
      if (planoParam && lista.some((p) => p.id === planoParam)) return planoParam;
      if (atual && lista.some((p) => p.id === atual)) return atual;
      return lista[0]?.id ?? "";
    });
    setTarefas((rTar.data ?? []) as Tarefa[]);
    setEventos((rEv.data ?? []) as Evento[]);
    setCobrancas((rCob.data ?? []) as Cobranca[]);
    if (rPlan.error) console.error("[portal] planejamentos:", rPlan.error.message);
    setCarregando(false);
  }, [clienteParam, planoParam, router]);

  useEffect(() => { carregar(); }, [carregar]);

  const plano = planos.find((p) => p.id === planoId) ?? null;

  // Entregas da semana + atrasadas não entregues
  const semana = useMemo(() => {
    const [ini, fim] = semanaAtual();
    const hj = hojeISO();
    return tarefas.filter((t) => {
      const d = soData(t.prazo);
      if (!d) return false;
      if (d >= ini && d <= fim) return true;
      return d < ini && t.status !== "concluida"; // atrasada ainda aberta
    }).sort((a, b) => soData(a.prazo).localeCompare(soData(b.prazo))).map((t) => ({
      ...t, atrasada: t.status !== "concluida" && soData(t.prazo) < hj,
    }));
  }, [tarefas]);
  const proximas = useMemo(() => {
    const [, fim] = semanaAtual();
    return tarefas.filter((t) => t.status !== "concluida" && soData(t.prazo) > fim).slice(0, 8);
  }, [tarefas]);
  const abertasSemana = semana.filter((t) => t.status !== "concluida").length;

  async function responder(acao: "aprovar" | "ajuste") {
    if (!plano) return;
    setEnviandoResp(true); setMsgResp("");
    const res = await fetch("/api/portal/aprovar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planejamento_id: plano.id, acao, comentario }),
    });
    const data = await res.json().catch(() => ({}));
    setEnviandoResp(false);
    if (!res.ok) { setMsgResp(data.error ?? "Não foi possível enviar."); return; }
    setFolhaAjuste(false); setComentario("");
    await carregar();
  }

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (carregando) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div className="mf-spinner" /></div>;
  }

  const aguardando = plano?.status_aprovacao === "enviado";

  return (
    <div className="portal">
      <style>{CSS}</style>

      {preview && (
        <div className="portal-preview">👁 Pré-visualização — é assim que o cliente vê. Os botões de aprovação ficam desativados para você.</div>
      )}

      {/* Topo */}
      <header className="portal-topo">
        <div className="portal-marca">
          <span className="portal-avatar" style={{ background: cliente?.cor_primaria || LARANJA }}>
            {cliente?.logo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={cliente.logo_url} alt={cliente.nome} />
              : iniciais(cliente?.nome ?? "")}
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="portal-ola">{preview ? "Portal do cliente" : `Olá${nomeUsuario ? ", " + nomeUsuario.split(" ")[0] : ""} 👋`}</div>
            <div className="portal-empresa">{cliente?.nome ?? "—"}</div>
          </div>
        </div>
        {!preview && <button className="portal-sair" onClick={sair}>Sair</button>}
      </header>

      <main className="portal-main">
        {erro && <div className="portal-card" style={{ textAlign: "center", color: "#A1A1AA" }}>{erro}</div>}

        {/* ── Planejamento ── */}
        {aba === "plano" && !erro && (
          <>
            {planos.length > 1 && (
              <div className="portal-meses">
                {planos.map((p) => (
                  <button key={p.id} className={`portal-mes ${p.id === planoId ? "on" : ""}`} onClick={() => setPlanoId(p.id)}>
                    {mesPorExtenso(p.mes_referencia)}
                  </button>
                ))}
              </div>
            )}

            {/* Resumo da semana em cima */}
            {semana.length > 0 && (
              <button className="portal-semana-resumo" onClick={() => setAba("semana")}>
                <span className="portal-semana-num">{abertasSemana}</span>
                <span style={{ flex: 1, textAlign: "left" }}>
                  <strong>{abertasSemana > 0 ? `entrega${abertasSemana !== 1 ? "s" : ""} em andamento esta semana` : "Tudo entregue esta semana ✅"}</strong>
                  <span>Toque para ver o que está sendo feito</span>
                </span>
                <span style={{ color: LARANJA, fontSize: 20 }}>›</span>
              </button>
            )}

            {plano?.status_aprovacao === "aprovado" && (
              <div className="portal-aviso verde">✅ Você aprovou este planejamento{plano.aprovado_cliente_em ? ` em ${new Date(plano.aprovado_cliente_em).toLocaleDateString("pt-BR")}` : ""}.</div>
            )}
            {plano?.status_aprovacao === "ajuste" && (
              <div className="portal-aviso amarelo">✏️ Você pediu um ajuste: “{plano.comentario_cliente}”. A equipe vai atualizar e te enviar de novo.</div>
            )}
            {plano?.status_aprovacao === "rascunho" && preview && (
              <div className="portal-aviso amarelo">Rascunho — o cliente só vê depois que você enviar.</div>
            )}

            {plano?.estrutura ? (
              <PlanoVisual
                estrutura={plano.estrutura}
                clienteNome={cliente?.nome ?? ""}
                clienteLogo={cliente?.logo_url}
                mesLabel={mesPorExtenso(plano.mes_referencia)}
              />
            ) : (
              <div className="portal-card portal-vazio">
                <div style={{ fontSize: 34 }}>🗓️</div>
                <strong>O planejamento do mês está sendo preparado</strong>
                <span>Assim que a MarketForge enviar, ele aparece aqui para você aprovar.</span>
              </div>
            )}
            <div style={{ height: aguardando ? 96 : 12 }} />
          </>
        )}

        {/* ── Esta semana ── */}
        {aba === "semana" && (
          <>
            <h2 className="portal-h2">Esta semana</h2>
            <p className="portal-sub">O que a equipe está produzindo e quando vai ser entregue.</p>
            {semana.length === 0 ? (
              <div className="portal-card portal-vazio"><div style={{ fontSize: 30 }}>📭</div><strong>Nenhuma entrega marcada para esta semana</strong></div>
            ) : (
              <div className="portal-lista">
                {semana.map((t) => {
                  const st = STATUS_TAREFA[t.status] ?? STATUS_TAREFA.pendente;
                  return (
                    <div key={t.id} className="portal-card portal-tarefa">
                      <div className="portal-tarefa-data" style={{ borderColor: t.atrasada ? "#F87171" : t.status === "concluida" ? "#3DDC84" : LARANJA }}>
                        <span>{diaCurto(t.prazo).split(",")[0]}</span>
                        <strong>{soData(t.prazo).slice(8, 10)}</strong>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="portal-tarefa-titulo">{t.titulo}</div>
                        <div className="portal-tarefa-meta">
                          <span className="portal-dot" style={{ background: st.cor }} />
                          {st.label}
                          {t.atrasada && <span style={{ color: "#F87171" }}> · atrasada</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {proximas.length > 0 && (
              <>
                <h3 className="portal-h3">Próximas entregas</h3>
                <div className="portal-lista">
                  {proximas.map((t) => (
                    <div key={t.id} className="portal-linha">
                      <span>{t.titulo}</span>
                      <span className="portal-linha-data">{diaCurto(t.prazo)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Agenda ── */}
        {aba === "agenda" && (
          <>
            <h2 className="portal-h2">Agenda</h2>
            <p className="portal-sub">Gravações e compromissos dos próximos 30 dias.</p>
            {eventos.length === 0 ? (
              <div className="portal-card portal-vazio"><div style={{ fontSize: 30 }}>🎬</div><strong>Nada agendado nos próximos dias</strong></div>
            ) : (
              <div className="portal-lista">
                {eventos.map((ev) => {
                  const d = new Date(ev.data_inicio);
                  return (
                    <div key={ev.id} className="portal-card portal-tarefa">
                      <div className="portal-tarefa-data" style={{ borderColor: ev.tipo === "gravacao" ? LARANJA : "#60A5FA" }}>
                        <span>{d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span>
                        <strong>{String(d.getDate()).padStart(2, "0")}</strong>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="portal-tarefa-titulo">{ev.tipo === "gravacao" ? "🎬 " : ""}{ev.titulo}</div>
                        <div className="portal-tarefa-meta">
                          {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}{ev.local ? ` · ${ev.local}` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Financeiro ── */}
        {aba === "financeiro" && (
          <>
            <h2 className="portal-h2">Financeiro</h2>
            <p className="portal-sub">Cobranças em aberto.</p>
            {cobrancas.length === 0 ? (
              <div className="portal-card portal-vazio"><div style={{ fontSize: 30 }}>✅</div><strong>Tudo em dia por aqui</strong></div>
            ) : (
              <div className="portal-lista">
                {cobrancas.map((c) => (
                  <div key={c.id} className="portal-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="portal-tarefa-titulo">{c.descricao || "Mensalidade"}</div>
                      <div className="portal-tarefa-meta" style={{ color: c.status === "atrasado" ? "#F87171" : undefined }}>
                        {c.status === "atrasado" ? "Vencida em " : "Vence em "}{diaCurto(c.vencimento)}
                      </div>
                    </div>
                    <strong style={{ fontSize: 16, whiteSpace: "nowrap" }}>{brl(Number(c.valor) || 0)}</strong>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <a className="portal-whats" href={`https://wa.me/${WHATSAPP_AGENCIA}?text=${encodeURIComponent(`Olá! Sou da ${cliente?.nome ?? "empresa"} e queria falar sobre o planejamento.`)}`} target="_blank" rel="noopener noreferrer">
          💬 Falar com a MarketForge no WhatsApp
        </a>
      </main>

      {/* Barra de aprovação */}
      {aba === "plano" && aguardando && (
        <div className="portal-aprovar">
          <div className="portal-aprovar-txt">Este é o planejamento de {mesPorExtenso(plano!.mes_referencia).split(" ")[0].toLowerCase()}. Está tudo certo?</div>
          <div className="portal-aprovar-botoes">
            <button className="pa-ajuste" disabled={preview || enviandoResp} onClick={() => { setMsgResp(""); setFolhaAjuste(true); }}>Pedir ajuste</button>
            <button className="pa-ok" disabled={preview || enviandoResp} onClick={() => { if (confirm("Aprovar o planejamento do mês?")) responder("aprovar"); }}>
              {enviandoResp ? "Enviando..." : "Aprovar planejamento"}
            </button>
          </div>
          {msgResp && !folhaAjuste && <div style={{ color: "#F87171", fontSize: 12, marginTop: 6, textAlign: "center" }}>{msgResp}</div>}
        </div>
      )}

      {/* Abas inferiores */}
      <nav className="portal-nav">
        {([
          ["plano", "Planejamento", "🗓️", 0],
          ["semana", "Semana", "✅", abertasSemana],
          ["agenda", "Agenda", "🎬", 0],
          ["financeiro", "Financeiro", "💳", cobrancas.filter((c) => c.status === "atrasado").length],
        ] as [Aba, string, string, number][]).map(([k, label, ic, badge]) => (
          <button key={k} className={aba === k ? "on" : ""} onClick={() => { setAba(k); window.scrollTo({ top: 0 }); }}>
            <span className="portal-nav-ic">{ic}{badge > 0 && <em>{badge}</em>}</span>
            {label}
          </button>
        ))}
      </nav>

      {/* Folha: pedir ajuste */}
      {folhaAjuste && (
        <div className="portal-folha-fundo" onClick={(e) => e.target === e.currentTarget && !enviandoResp && setFolhaAjuste(false)}>
          <div className="portal-folha">
            <div className="portal-folha-alca" />
            <h3 style={{ margin: "0 0 4px", fontSize: 17 }}>O que você quer ajustar?</h3>
            <p style={{ margin: "0 0 12px", color: "#A1A1AA", fontSize: 13 }}>Conte com suas palavras. A equipe recebe na hora.</p>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={5}
              autoFocus
              placeholder="Ex.: o pagode agora é na sexta, e queria um vídeo do almoço de domingo."
            />
            {msgResp && <div style={{ color: "#F87171", fontSize: 12.5, marginTop: 8 }}>{msgResp}</div>}
            <button className="pa-ok" style={{ width: "100%", marginTop: 12 }} disabled={enviandoResp || comentario.trim().length < 3} onClick={() => responder("ajuste")}>
              {enviandoResp ? "Enviando..." : "Enviar pedido de ajuste"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <PortalConteudo />
    </Suspense>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
.portal { font-family:'Poppins',system-ui,sans-serif; min-height:100vh; background:#0B0B0B; color:#fff; padding-bottom:calc(84px + env(safe-area-inset-bottom)); }
.portal * { box-sizing:border-box; }
.portal-preview { background:${LARANJA}; color:#fff; font-size:12px; font-weight:600; text-align:center; padding:8px 12px; }
.portal-topo { position:sticky; top:0; z-index:20; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:calc(12px + env(safe-area-inset-top)) 16px 12px; background:rgba(11,11,11,0.88); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); border-bottom:1px solid #1F1F1F; }
.portal-marca { display:flex; align-items:center; gap:12px; min-width:0; }
.portal-avatar { width:44px; height:44px; border-radius:50%; flex-shrink:0; overflow:hidden; display:flex; align-items:center; justify-content:center; font-weight:800; box-shadow:0 0 0 2px #0B0B0B, 0 0 0 4px ${LARANJA}; }
.portal-avatar img { width:100%; height:100%; object-fit:cover; background:#fff; }
.portal-ola { font-size:12px; color:#A1A1AA; }
.portal-empresa { font-size:16px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.portal-sair { background:none; border:1px solid #333; color:#A1A1AA; border-radius:999px; padding:6px 14px; font-size:12px; cursor:pointer; font-family:inherit; }
.portal-main { max-width:860px; margin:0 auto; padding:16px 12px; }
.portal-card { background:#161616; border:1px solid #262626; border-radius:16px; padding:14px 16px; }
.portal-vazio { display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px; padding:36px 20px; color:#E5E5E5; }
.portal-vazio span { color:#A1A1AA; font-size:13px; }
.portal-meses { display:flex; gap:8px; overflow-x:auto; margin:0 -12px 12px; padding:0 12px; scrollbar-width:none; }
.portal-meses::-webkit-scrollbar { display:none; }
.portal-mes { flex-shrink:0; background:#161616; border:1px solid #262626; color:#A1A1AA; border-radius:999px; padding:7px 14px; font-size:12.5px; font-weight:600; cursor:pointer; font-family:inherit; }
.portal-mes.on { background:${LARANJA}; border-color:${LARANJA}; color:#fff; }
.portal-semana-resumo { width:100%; display:flex; align-items:center; gap:12px; background:linear-gradient(90deg,#2A1406,#161616); border:1px solid ${LARANJA}; color:#fff; border-radius:16px; padding:12px 14px; margin-bottom:12px; cursor:pointer; font-family:inherit; }
.portal-semana-resumo strong { display:block; font-size:13.5px; }
.portal-semana-resumo span span, .portal-semana-resumo > span:nth-child(2) > span { display:block; font-size:11.5px; color:#A1A1AA; }
.portal-semana-num { width:42px; height:42px; border-radius:12px; background:${LARANJA}; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:800; flex-shrink:0; }
.portal-aviso { border-radius:14px; padding:11px 14px; font-size:13px; margin-bottom:12px; }
.portal-aviso.verde { background:#0E2A19; border:1px solid #1F6E3F; color:#86EFAC; }
.portal-aviso.amarelo { background:#2A2109; border:1px solid #7A5F1F; color:#FDE68A; }
.portal-h2 { font-size:22px; font-weight:800; margin:6px 0 2px; letter-spacing:-.01em; }
.portal-h3 { font-size:15px; font-weight:700; margin:24px 0 10px; }
.portal-sub { color:#A1A1AA; font-size:13px; margin:0 0 14px; }
.portal-lista { display:flex; flex-direction:column; gap:10px; }
.portal-tarefa { display:flex; align-items:center; gap:14px; }
.portal-tarefa-data { width:54px; height:58px; border-radius:14px; border:2px solid ${LARANJA}; display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; background:#0F0F0F; }
.portal-tarefa-data span { font-size:10px; text-transform:uppercase; color:#A1A1AA; font-weight:600; }
.portal-tarefa-data strong { font-size:20px; line-height:1.1; }
.portal-tarefa-titulo { font-weight:600; font-size:14px; line-height:1.3; }
.portal-tarefa-meta { font-size:12px; color:#A1A1AA; margin-top:3px; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.portal-dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
.portal-linha { display:flex; justify-content:space-between; gap:12px; padding:12px 14px; border-bottom:1px solid #1F1F1F; font-size:13.5px; }
.portal-linha-data { color:#A1A1AA; white-space:nowrap; font-size:12.5px; }
.portal-whats { display:block; text-align:center; margin:28px auto 8px; padding:13px 16px; border-radius:14px; background:#25D366; color:#062B14; font-weight:700; font-size:14px; text-decoration:none; max-width:420px; }
.portal-aprovar { position:fixed; left:0; right:0; bottom:calc(64px + env(safe-area-inset-bottom)); z-index:30; padding:12px 14px; background:rgba(22,22,22,0.96); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); border-top:1px solid #2A2A2A; }
.portal-aprovar-txt { font-size:12.5px; color:#D4D4D8; text-align:center; margin-bottom:8px; }
.portal-aprovar-botoes { display:flex; gap:8px; max-width:560px; margin:0 auto; }
.pa-ajuste, .pa-ok { border:none; border-radius:12px; padding:13px 14px; font-weight:700; font-size:14px; cursor:pointer; font-family:inherit; }
.pa-ajuste { flex:0 0 38%; background:#262626; color:#fff; }
.pa-ok { flex:1; background:${LARANJA}; color:#fff; }
.pa-ajuste:disabled, .pa-ok:disabled { opacity:.5; cursor:not-allowed; }
.portal-nav { position:fixed; left:0; right:0; bottom:0; z-index:31; display:flex; height:calc(64px + env(safe-area-inset-bottom)); padding-bottom:env(safe-area-inset-bottom); background:rgba(11,11,11,0.95); -webkit-backdrop-filter:blur(16px); backdrop-filter:blur(16px); border-top:1px solid #1F1F1F; }
.portal-nav button { flex:1; background:none; border:none; color:#71717A; font-size:10.5px; font-weight:600; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; cursor:pointer; font-family:inherit; position:relative; }
.portal-nav button.on { color:#fff; }
.portal-nav button.on::before { content:""; position:absolute; top:0; width:28px; height:3px; border-radius:0 0 3px 3px; background:${LARANJA}; }
.portal-nav-ic { font-size:20px; position:relative; filter:grayscale(1); opacity:.7; }
.portal-nav button.on .portal-nav-ic { filter:none; opacity:1; }
.portal-nav-ic em { position:absolute; top:-4px; right:-10px; background:${LARANJA}; color:#fff; font-style:normal; font-size:9.5px; font-weight:800; min-width:16px; height:16px; border-radius:999px; display:flex; align-items:center; justify-content:center; padding:0 4px; }
.portal-folha-fundo { position:fixed; inset:0; z-index:50; background:rgba(0,0,0,0.6); display:flex; align-items:flex-end; justify-content:center; }
.portal-folha { width:100%; max-width:560px; background:#161616; border-radius:22px 22px 0 0; padding:10px 18px calc(18px + env(safe-area-inset-bottom)); animation:pf-sobe 240ms cubic-bezier(.2,.9,.3,1); }
.portal-folha-alca { width:40px; height:5px; border-radius:999px; background:#3F3F46; margin:0 auto 14px; }
.portal-folha textarea { width:100%; background:#0F0F0F; color:#fff; border:1px solid #333; border-radius:12px; padding:12px; font-size:16px; font-family:inherit; resize:vertical; }
.portal-folha textarea:focus { outline:none; border-color:${LARANJA}; }
@keyframes pf-sobe { from { transform:translateY(100%); } to { transform:translateY(0); } }
@media (min-width: 640px) { .portal-main { padding:24px 20px; } }
`;

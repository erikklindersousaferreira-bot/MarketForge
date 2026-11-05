"use client";

// components/planejamento/PlanoVisual.tsx
// Planejamento do mês no visual escuro da MarketForge (igual ao PDF), pensado para o celular.
import type { EstruturaPlanejamento } from "@/lib/planejamento-tipos";

const LARANJA = "#FF6A00";
const DOURADO = "#E8C27A";

type Props = {
  estrutura: EstruturaPlanejamento;
  clienteNome: string;
  clienteLogo?: string | null;
  mesLabel: string;
};

function Secao({ n, titulo, subtitulo, extra, children }: { n: number; titulo: string; subtitulo?: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="pv-secao">
      <div className="pv-secao-topo">
        <span className="pv-num">{n}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="pv-h2">{titulo}</h2>
          {subtitulo && <p className="pv-sub">{subtitulo}</p>}
        </div>
        {extra}
      </div>
      {children}
    </section>
  );
}

function Pilula({ children, cor = LARANJA, escura = false }: { children: React.ReactNode; cor?: string; escura?: boolean }) {
  return (
    <span className="pv-pilula" style={{ background: escura ? "transparent" : cor, color: escura ? cor : "#111", borderColor: cor }}>
      {children}
    </span>
  );
}

export function PlanoVisual({ estrutura: e, clienteNome, clienteLogo, mesLabel }: Props) {
  let n = 0;
  const prox = () => ++n;

  return (
    <div className="pv">
      <style>{CSS}</style>

      {/* ── Capa ── */}
      <header className="pv-capa">
        <div className="pv-kicker">Planejamento de marketing</div>
        <div className="pv-traco" />
        {clienteLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clienteLogo} alt={clienteNome} className="pv-capa-logo" />
        ) : (
          <h1 className="pv-capa-nome">{clienteNome}</h1>
        )}
        {e.subtitulo && <p className="pv-capa-sub">{e.subtitulo}</p>}
        <div className="pv-capa-mes">{mesLabel}</div>
        {e.introducao && <p className="pv-capa-intro">{e.introducao}</p>}
        <div className="pv-capa-assina">
          <span>Estratégia desenvolvida por</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-branca.png" alt="MarketForge" />
        </div>
      </header>

      {/* ── 1. Objetivos ── */}
      {!!e.objetivos?.length && (
        <Secao n={prox()} titulo="Objetivo do marketing" subtitulo={e.objetivos.length > 1 ? `${e.objetivos.length} focos principais do trabalho` : "Foco principal do trabalho"}>
          <div className="pv-grid2">
            {e.objetivos.map((o, i) => (
              <div key={i} className="pv-card pv-card-borda">
                <span className="pv-letra">{String.fromCharCode(65 + i)}</span>
                <div>
                  <h3 className="pv-h3">{o.titulo}</h3>
                  {o.descricao && <p className="pv-txt">{o.descricao}</p>}
                </div>
              </div>
            ))}
          </div>
        </Secao>
      )}

      {/* ── 2. Rotina ── */}
      {e.rotina && !!e.rotina.itens?.length && (
        <Secao
          n={prox()}
          titulo={e.rotina.titulo}
          subtitulo={e.rotina.subtitulo}
          extra={e.rotina.frequencia ? <Pilula>{e.rotina.frequencia}</Pilula> : undefined}
        >
          <div className="pv-grid4">
            {e.rotina.itens.map((it, i) => (
              <div key={i} className="pv-card">
                <span className="pv-bolinha">{i + 1}</span>
                <h3 className="pv-h3">{it.titulo}</h3>
                {it.descricao && <p className="pv-txt">{it.descricao}</p>}
              </div>
            ))}
          </div>
          {e.rotina.observacao && <p className="pv-nota">{e.rotina.observacao}</p>}
          {e.rotina.destaque && (
            <div className="pv-card pv-card-dourado" style={{ marginTop: 14 }}>
              <h3 className="pv-h3" style={{ color: DOURADO, textTransform: "uppercase", letterSpacing: "0.02em" }}>{e.rotina.destaque.titulo}</h3>
              <p className="pv-txt" style={{ color: "#E5E5E5" }}>{e.rotina.destaque.texto}</p>
              {!!e.rotina.destaque.tags?.length && (
                <div className="pv-tags">
                  {e.rotina.destaque.tags.map((t, i) => <Pilula key={i} cor={DOURADO} escura>{t}</Pilula>)}
                </div>
              )}
            </div>
          )}
        </Secao>
      )}

      {/* ── 3. Frentes ── */}
      {e.frentes && !!e.frentes.itens?.length && (
        <Secao n={prox()} titulo={e.frentes.titulo} subtitulo={e.frentes.subtitulo}>
          <div className="pv-grid4">
            {e.frentes.itens.map((t, i) => (
              <div key={i} className="pv-card" style={{ paddingTop: 14 }}>
                <span className="pv-tracinho" />
                <h3 className="pv-h3">{t}</h3>
              </div>
            ))}
          </div>
          {e.frentes.aviso && (
            <div className="pv-aviso">
              <Pilula cor={DOURADO}>A confirmar</Pilula>
              <span>{e.frentes.aviso}</span>
            </div>
          )}
          {!!e.frentes.como_funciona?.length && (
            <>
              <div className="pv-rotulo">Como funciona</div>
              <div className="pv-fluxo">
                {e.frentes.como_funciona.map((c, i) => (
                  <div key={i} className="pv-fluxo-item">
                    <div className="pv-card" style={{ height: "100%" }}>
                      <h3 className="pv-h3">{c.titulo}</h3>
                      {c.descricao && <p className="pv-txt">{c.descricao}</p>}
                    </div>
                    {i < e.frentes!.como_funciona!.length - 1 && <span className="pv-seta">▶</span>}
                  </div>
                ))}
              </div>
            </>
          )}
          {e.frentes.objetivo && (
            <div className="pv-objetivo"><div className="pv-rotulo" style={{ margin: 0 }}>Objetivo</div>{e.frentes.objetivo}</div>
          )}
        </Secao>
      )}

      {/* ── 4. Cronograma ── */}
      {e.cronograma && !!e.cronograma.itens?.length && (
        <Secao n={prox()} titulo={e.cronograma.titulo || "Cronograma"} subtitulo={e.cronograma.subtitulo}>
          <div className="pv-crono">
            {e.cronograma.itens.map((c, i) => (
              <div key={i} className="pv-crono-linha">
                <div className={`pv-crono-data ${c.destaque ? "on" : i === 0 ? "on" : "contorno"}`}>{c.quando}</div>
                <div className="pv-card pv-crono-card">
                  <h3 className="pv-h3">{c.titulo}</h3>
                  {c.descricao && <p className="pv-txt">{c.descricao}</p>}
                </div>
              </div>
            ))}
          </div>
        </Secao>
      )}

      {/* ── 5. Ações com data ── */}
      {e.acoes && !!e.acoes.itens?.length && (
        <Secao n={prox()} titulo={e.acoes.titulo || "Ações especiais"} subtitulo={e.acoes.subtitulo}>
          <div style={{ display: "grid", gap: 12 }}>
            {e.acoes.itens.map((a, i) => (
              <div key={i} className="pv-card pv-acao">
                <div className="pv-acao-data">
                  <strong>{a.data}</strong>
                  {a.tipo && <span>{a.tipo}</span>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 className="pv-h3" style={{ fontSize: "1.0625rem" }}>{a.titulo}</h3>
                  {a.objetivo && (<><div className="pv-rotulo" style={{ margin: "6px 0 2px" }}>Objetivo</div><p className="pv-txt">{a.objetivo}</p></>)}
                  {a.status && (
                    <span className="pv-status" style={{ background: a.status === "programado" ? "#3DDC84" : DOURADO }}>
                      {a.status === "programado" ? "Já programado" : "Aguardando"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Secao>
      )}

      {/* ── 6. Próxima etapa ── */}
      {e.proxima_etapa && (
        <Secao n={prox()} titulo={e.proxima_etapa.titulo} subtitulo={e.proxima_etapa.subtitulo}>
          {e.proxima_etapa.descricao && <div className="pv-card pv-card-dourado"><p className="pv-txt" style={{ color: "#E5E5E5", margin: 0 }}>{e.proxima_etapa.descricao}</p></div>}
          {!!e.proxima_etapa.itens?.length && (
            <>
              <div className="pv-rotulo">O que será feito</div>
              <div className="pv-grid2 pv-lista">
                {e.proxima_etapa.itens.map((t, i) => (
                  <div key={i} className="pv-card pv-lista-item"><span className="pv-bolinha on">{i + 1}</span><span>{t}</span></div>
                ))}
              </div>
            </>
          )}
          {e.proxima_etapa.objetivo && (
            <div className="pv-objetivo"><div className="pv-rotulo" style={{ margin: 0 }}>Objetivo</div>{e.proxima_etapa.objetivo}</div>
          )}
          {e.proxima_etapa.status && (
            <div className="pv-aviso" style={{ marginTop: 12 }}><Pilula cor={DOURADO}>Status</Pilula><span>{e.proxima_etapa.status}</span></div>
          )}
        </Secao>
      )}

      {/* ── 7. Resumo ── */}
      {e.resumo && (
        <Secao n={prox()} titulo="Resumo da estratégia" subtitulo="Tudo o que está por trás do trabalho, em um olhar">
          {!!e.resumo.cards?.length && (
            <div className="pv-grid3">
              {e.resumo.cards.map((c, i) => (
                <div key={i} className={`pv-card ${c.destaque ? "pv-card-laranja" : ""}`}>
                  <div className="pv-rotulo" style={{ margin: "0 0 4px", color: c.destaque ? "#fff" : LARANJA }}>{c.rotulo}</div>
                  <h3 className="pv-h3" style={{ fontSize: c.destaque ? "1.375rem" : undefined }}>{c.titulo}</h3>
                  {c.descricao && <p className="pv-txt" style={{ color: c.destaque ? "rgba(255,255,255,0.85)" : undefined }}>{c.descricao}</p>}
                </div>
              ))}
            </div>
          )}
          {(!!e.resumo.ja_programado?.length || !!e.resumo.depende_cliente?.length) && (
            <>
              <div className="pv-rotulo">O que já está programado × o que depende de vocês</div>
              <div className="pv-grid2">
                {!!e.resumo.ja_programado?.length && (
                  <div className="pv-card" style={{ borderColor: "#3DDC84" }}>
                    <span className="pv-status" style={{ background: "#3DDC84", marginTop: 0 }}>Já programado</span>
                    <ul className="pv-ul">{e.resumo.ja_programado.map((t, i) => <li key={i} style={{ ["--c" as string]: "#3DDC84" }}>{t}</li>)}</ul>
                  </div>
                )}
                {!!e.resumo.depende_cliente?.length && (
                  <div className="pv-card" style={{ borderColor: DOURADO }}>
                    <span className="pv-status" style={{ background: DOURADO, marginTop: 0 }}>Depende de vocês</span>
                    <ul className="pv-ul">{e.resumo.depende_cliente.map((t, i) => <li key={i} style={{ ["--c" as string]: DOURADO }}>{t}</li>)}</ul>
                  </div>
                )}
              </div>
            </>
          )}
          {e.resumo.frase_final && (
            <div className="pv-final">
              <strong>{e.resumo.frase_final}</strong>
              {e.resumo.subfrase && <span>{e.resumo.subfrase}</span>}
            </div>
          )}
        </Secao>
      )}

      <footer className="pv-rodape">MarketForge · Planejamento de Marketing para {clienteNome}</footer>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
.pv { background:#0B0B0B; color:#fff; font-family:'Poppins',system-ui,sans-serif; border-radius:20px; overflow:hidden; padding:0 18px 24px; }
.pv * { box-sizing:border-box; }
.pv-capa { text-align:center; padding:48px 8px 32px; margin:0 -18px 8px; background:radial-gradient(ellipse at center 45%, #2A1A06 0%, #0B0B0B 62%); }
.pv-kicker { color:${LARANJA}; font-size:12px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; }
.pv-traco { width:56px; height:2px; background:${LARANJA}; margin:10px auto 28px; border-radius:2px; }
.pv-capa-logo { max-width:min(320px,80%); max-height:150px; object-fit:contain; margin:0 auto; display:block; }
.pv-capa-nome { font-size:clamp(30px,8vw,52px); font-weight:800; margin:0; letter-spacing:-.02em; line-height:1.05; }
.pv-capa-sub { color:${DOURADO}; font-size:14px; margin:18px 0 0; }
.pv-capa-mes { font-weight:600; font-size:14px; margin-top:28px; }
.pv-capa-intro { color:#A1A1AA; font-size:13px; max-width:520px; margin:12px auto 0; line-height:1.55; }
.pv-capa-assina { margin-top:32px; padding-top:18px; border-top:1px solid #222; display:flex; flex-direction:column; align-items:center; gap:10px; color:#71717A; font-size:11px; }
.pv-capa-assina img { width:130px; }
.pv-secao { margin-top:34px; }
.pv-secao-topo { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
.pv-num { width:34px; height:34px; border-radius:50%; background:${LARANJA}; color:#fff; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:15px; }
.pv-h2 { margin:0; font-size:19px; font-weight:800; text-transform:uppercase; letter-spacing:-.01em; line-height:1.15; }
.pv-sub { margin:2px 0 0; color:#A1A1AA; font-size:12px; }
.pv-h3 { margin:0; font-size:14.5px; font-weight:700; line-height:1.3; }
.pv-txt { margin:6px 0 0; color:#A1A1AA; font-size:12.5px; line-height:1.5; }
.pv-nota { color:#71717A; font-size:11.5px; margin:10px 0 0; }
.pv-card { background:#161616; border:1px solid #262626; border-radius:16px; padding:16px; position:relative; }
.pv-card-borda { border-left:4px solid ${LARANJA}; display:flex; gap:12px; }
.pv-card-dourado { border-color:${DOURADO}; background:#14110B; }
.pv-card-laranja { background:${LARANJA}; border-color:${LARANJA}; }
.pv-letra { color:${LARANJA}; font-size:26px; font-weight:800; line-height:1; }
.pv-bolinha { width:26px; height:26px; border-radius:50%; background:#262626; color:${LARANJA}; font-weight:700; font-size:12px; display:inline-flex; align-items:center; justify-content:center; margin-bottom:10px; flex-shrink:0; }
.pv-bolinha.on { background:${LARANJA}; color:#fff; margin:0; }
.pv-tracinho { display:block; width:22px; height:3px; background:${LARANJA}; border-radius:2px; margin-bottom:10px; }
.pv-grid2, .pv-grid3, .pv-grid4 { display:grid; gap:10px; grid-template-columns:1fr; }
.pv-grid4 { grid-template-columns:repeat(2,1fr); }
.pv-pilula { display:inline-block; border:1px solid; border-radius:999px; padding:4px 11px; font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.03em; white-space:nowrap; }
.pv-tags { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
.pv-tags .pv-pilula { text-transform:none; font-weight:500; font-size:11.5px; }
.pv-aviso { display:flex; align-items:center; gap:12px; margin-top:12px; padding:10px 12px; border:1px solid ${DOURADO}; border-radius:12px; background:#14110B; font-size:12.5px; color:#E5E5E5; }
.pv-rotulo { color:${LARANJA}; font-size:10.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; margin:20px 0 10px; }
.pv-fluxo { display:grid; gap:10px; }
.pv-fluxo-item { display:flex; flex-direction:column; align-items:stretch; }
.pv-seta { color:${LARANJA}; text-align:center; transform:rotate(90deg); margin:4px 0 -2px; font-size:14px; }
.pv-objetivo { margin-top:14px; padding:12px 14px; border:1px solid ${LARANJA}; border-radius:12px; background:linear-gradient(90deg,#2A1406,#120C08); font-size:13.5px; font-weight:500; }
.pv-crono { display:flex; flex-direction:column; gap:0; }
.pv-crono-linha { display:grid; grid-template-columns:96px 1fr; gap:10px; position:relative; padding-bottom:14px; }
.pv-crono-linha:not(:last-child)::after { content:""; position:absolute; left:48px; top:62px; bottom:0; border-left:2px dashed ${LARANJA}; opacity:.7; }
.pv-crono-data { position:relative; z-index:1; border-radius:14px; display:flex; align-items:center; justify-content:center; text-align:center; font-weight:800; min-height:62px; padding:6px; font-size:15px; line-height:1.15; }
.pv-crono-data.on { background:${LARANJA}; color:#fff; font-size:20px; }
.pv-crono-data.contorno { border:1.5px solid ${LARANJA}; color:${LARANJA}; background:#161616; font-size:12.5px; }
.pv-crono-card { display:flex; flex-direction:column; justify-content:center; }
.pv-acao { display:grid; grid-template-columns:104px 1fr; gap:14px; align-items:center; }
.pv-acao-data { background:${LARANJA}; border-radius:14px; aspect-ratio:1/1; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.pv-acao-data strong { font-size:24px; font-weight:800; }
.pv-acao-data span { font-size:10px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; margin-top:2px; }
.pv-status { display:inline-block; margin-top:12px; color:#111; border-radius:999px; padding:4px 11px; font-size:10.5px; font-weight:800; text-transform:uppercase; letter-spacing:.03em; }
.pv-lista-item { display:flex; align-items:center; gap:10px; padding:12px 14px; font-size:13px; }
.pv-ul { list-style:none; padding:0; margin:12px 0 0; display:grid; gap:10px; font-size:13px; }
.pv-ul li { display:flex; gap:10px; align-items:flex-start; }
.pv-ul li::before { content:""; width:8px; height:8px; border-radius:50%; background:var(--c); margin-top:6px; flex-shrink:0; }
.pv-final { margin-top:18px; padding:16px; border:1px solid ${LARANJA}; border-radius:14px; background:#120C08; text-align:center; display:flex; flex-direction:column; gap:4px; }
.pv-final strong { font-size:14.5px; }
.pv-final span { color:#A1A1AA; font-size:12.5px; }
.pv-rodape { margin-top:30px; padding-top:14px; border-top:1px solid #1F1F1F; color:#52525B; font-size:10.5px; text-align:center; }
@media (min-width: 640px) {
  .pv { padding:0 32px 32px; }
  .pv-capa { margin:0 -32px 8px; padding:72px 16px 40px; }
  .pv-grid2 { grid-template-columns:repeat(2,1fr); }
  .pv-grid3 { grid-template-columns:repeat(3,1fr); }
  .pv-grid4 { grid-template-columns:repeat(4,1fr); }
  .pv-fluxo { grid-template-columns:repeat(var(--n,3),1fr); grid-auto-flow:column; }
  .pv-fluxo-item { flex-direction:row; align-items:center; gap:8px; }
  .pv-fluxo-item > .pv-card { flex:1; }
  .pv-seta { transform:none; margin:0; }
  .pv-crono-linha { grid-template-columns:150px 1fr; gap:16px; }
  .pv-crono-linha:not(:last-child)::after { left:75px; }
  .pv-acao { grid-template-columns:150px 1fr; }
}
`;

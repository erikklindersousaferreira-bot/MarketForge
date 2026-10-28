// app/api/gerar-pdf-planejamento/route.ts
// Gera PDF do planejamento de marketing usando Puppeteer (mesma infra do relatório de tráfego)

import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = "https://jadhnzbuxgnjibymtcmn.supabase.co";
const BUCKET = "relatorios";
const AGENCIA_LOGO = "https://i.postimg.cc/jdB530mK/mkt.png";
const COR_PRIMARY = "#FF6200";
const COR_DARK = "#1F2F46";

type Bloco =
  | { tipo: "capa"; titulo?: string; subtitulo?: string; logo_url?: string }
  | { tipo: "objetivo"; titulo?: string; texto?: string }
  | { tipo: "lista"; titulo?: string; itens?: string[] }
  | { tipo: "cronograma"; titulo?: string; itens?: Array<{ data?: string; titulo?: string; desc?: string } | string> }
  | { tipo: "destaque_data"; data?: string; titulo?: string; desc?: string }
  | { tipo: "duas_colunas"; titulo?: string; col_esq?: string; col_dir?: string }
  | { tipo: "resumo"; titulo?: string; texto?: string }
  | Record<string, unknown>;

type PlanejamentoInput = {
  planejamentoId?: string;
  titulo?: string;
  mesRef?: string;
  clienteNome?: string;
  clienteLogoUrl?: string;
  blocos?: Bloco[];
};

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

const nl2br = (s: string) => esc(s).replace(/\n/g, "<br/>");

function renderBloco(b: Bloco): string {
  switch (b.tipo) {
    case "capa":
      return `
        <div class="bloco-capa">
          ${b.logo_url ? `<img src="${esc(b.logo_url)}" class="capa-logo-cli"/>` : ""}
          <div class="capa-title">${esc(b.titulo || "Planejamento de Marketing")}</div>
          ${b.subtitulo ? `<div class="capa-sub">${esc(b.subtitulo)}</div>` : ""}
        </div>`;

    case "objetivo":
      return `
        <div class="bloco">
          <div class="bloco-header"><span class="bloco-bar"></span>${esc(b.titulo || "Objetivo")}</div>
          <div class="bloco-text">${nl2br(b.texto || "")}</div>
        </div>`;

    case "lista":
      const itens = (b.itens || []).filter(Boolean);
      return `
        <div class="bloco">
          ${b.titulo ? `<div class="bloco-header"><span class="bloco-bar"></span>${esc(b.titulo)}</div>` : ""}
          <ol class="lista-num">
            ${itens.map((it) => `<li>${esc(String(it))}</li>`).join("")}
          </ol>
        </div>`;

    case "cronograma":
      const crono = (b.itens || []).filter(Boolean);
      return `
        <div class="bloco">
          ${b.titulo ? `<div class="bloco-header"><span class="bloco-bar"></span>${esc(b.titulo)}</div>` : ""}
          <div class="cronograma-grid">
            ${crono.map((it) => {
              const item = typeof it === "object" ? it as { data?: string; titulo?: string; desc?: string } : { data: "", titulo: String(it), desc: "" };
              return `<div class="crono-row">
                <div class="crono-data">${esc(item.data || "")}</div>
                <div class="crono-body">
                  <div class="crono-titulo">${esc(item.titulo || "")}</div>
                  ${item.desc ? `<div class="crono-desc">${esc(item.desc)}</div>` : ""}
                </div>
              </div>`;
            }).join("")}
          </div>
        </div>`;

    case "destaque_data":
      return `
        <div class="bloco destaque-data-bloco">
          <div class="destaque-data-inner">
            <div class="destaque-data-badge">${esc(b.data || "")}</div>
            <div class="destaque-data-right">
              <div class="destaque-data-title">${esc(b.titulo || "")}</div>
              ${b.desc ? `<div class="destaque-data-desc">${esc(b.desc)}</div>` : ""}
            </div>
          </div>
        </div>`;

    case "duas_colunas":
      return `
        <div class="bloco">
          ${b.titulo ? `<div class="bloco-header"><span class="bloco-bar"></span>${esc(b.titulo)}</div>` : ""}
          <div class="duas-cols">
            <div class="col-box">${nl2br(b.col_esq || "")}</div>
            <div class="col-box">${nl2br(b.col_dir || "")}</div>
          </div>
        </div>`;

    case "resumo":
      return `
        <div class="bloco bloco-resumo">
          ${b.titulo ? `<div class="bloco-header"><span class="bloco-bar"></span>${esc(b.titulo)}</div>` : ""}
          <div class="resumo-text">${nl2br(b.texto || "")}</div>
        </div>`;

    default:
      return "";
  }
}

function buildHtml(data: PlanejamentoInput): string {
  const { titulo, mesRef, clienteNome, clienteLogoUrl, blocos = [] } = data;
  const blocosHtml = blocos.map(renderBloco).join("\n");

  // Capa padrão se não tiver bloco de capa
  const temCapa = blocos.some((b) => b.tipo === "capa");
  const capaDefault = temCapa ? "" : `
    <div class="bloco-capa">
      ${clienteLogoUrl ? `<img src="${esc(clienteLogoUrl)}" class="capa-logo-cli"/>` : ""}
      <div class="capa-title">${esc(titulo || "Planejamento de Marketing")}</div>
      ${mesRef ? `<div class="capa-sub">${esc(mesRef)}</div>` : ""}
      ${clienteNome ? `<div class="capa-cliente">${esc(clienteNome)}</div>` : ""}
    </div>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Poppins', 'Segoe UI', sans-serif; color: #1F2937; background: #fff; }

  /* HEADER (todas as páginas) */
  .page-header {
    background: ${COR_DARK};
    padding: 14px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .page-header img { height: 28px; object-fit: contain; }
  .page-header .hdr-right { color: rgba(255,255,255,0.6); font-size: 11px; font-weight: 600; text-align: right; }
  .page-header .hdr-right b { color: #fff; display: block; font-size: 12px; }

  /* CAPA */
  .bloco-capa {
    background: linear-gradient(135deg, ${COR_DARK} 0%, #2D4A6A 60%, ${COR_PRIMARY} 150%);
    min-height: 260px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 48px 40px;
    color: #fff;
    page-break-after: always;
  }
  .capa-logo-cli { height: 64px; object-fit: contain; margin-bottom: 20px; border-radius: 8px; }
  .capa-title { font-size: 28px; font-weight: 800; line-height: 1.2; margin-bottom: 10px; }
  .capa-sub { font-size: 15px; font-weight: 600; opacity: 0.85; margin-bottom: 8px; color: #FFD9B8; }
  .capa-cliente { font-size: 12px; opacity: 0.7; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; }

  /* CONTEÚDO */
  .content { padding: 28px 40px; }

  /* BLOCO GENÉRICO */
  .bloco { margin-bottom: 22px; }
  .bloco-header {
    display: flex; align-items: center; gap: 8px;
    font-size: 14px; font-weight: 800; color: ${COR_DARK};
    margin-bottom: 10px;
  }
  .bloco-bar { width: 4px; height: 15px; background: ${COR_PRIMARY}; border-radius: 3px; display: inline-block; flex-shrink: 0; }
  .bloco-text { font-size: 12.5px; line-height: 1.7; color: #374151; }

  /* LISTA NUMERADA */
  .lista-num { padding-left: 22px; font-size: 12.5px; line-height: 1.8; color: #374151; }
  .lista-num li { margin-bottom: 4px; }
  .lista-num li::marker { color: ${COR_PRIMARY}; font-weight: 800; }

  /* CRONOGRAMA */
  .cronograma-grid { display: flex; flex-direction: column; gap: 8px; }
  .crono-row { display: flex; gap: 12px; align-items: flex-start; padding: 10px 14px; background: #F8FAFC; border-radius: 10px; border-left: 3px solid ${COR_PRIMARY}; }
  .crono-data { min-width: 70px; font-size: 11px; font-weight: 800; color: ${COR_PRIMARY}; padding-top: 2px; flex-shrink: 0; }
  .crono-titulo { font-size: 12.5px; font-weight: 700; color: ${COR_DARK}; }
  .crono-desc { font-size: 11.5px; color: #64748B; margin-top: 2px; }

  /* DESTAQUE DE DATA */
  .destaque-data-bloco { background: #FFF7F3; border-radius: 12px; padding: 16px 18px; }
  .destaque-data-inner { display: flex; align-items: center; gap: 16px; }
  .destaque-data-badge {
    background: ${COR_PRIMARY}; color: #fff; border-radius: 10px;
    padding: 10px 16px; font-size: 14px; font-weight: 800;
    min-width: 80px; text-align: center; flex-shrink: 0;
  }
  .destaque-data-title { font-size: 14px; font-weight: 800; color: ${COR_DARK}; }
  .destaque-data-desc { font-size: 12px; color: #64748B; margin-top: 4px; }

  /* DUAS COLUNAS */
  .duas-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .col-box { background: #F8FAFC; border-radius: 10px; padding: 14px 16px; font-size: 12.5px; line-height: 1.7; color: #374151; border: 1px solid #EEF3F8; }

  /* RESUMO */
  .bloco-resumo .resumo-text {
    background: linear-gradient(135deg, #FFF7F3, #FFF);
    border-left: 4px solid ${COR_PRIMARY};
    border-radius: 10px;
    padding: 16px 18px;
    font-size: 12.5px;
    line-height: 1.7;
    color: #374151;
    font-weight: 600;
  }

  /* RODAPÉ */
  .page-footer {
    background: ${COR_DARK};
    color: rgba(255,255,255,0.6);
    text-align: center;
    padding: 18px 40px;
    font-size: 10px;
    margin-top: 32px;
  }
  .page-footer b { color: #fff; }
</style>
</head>
<body>

<div class="page-header">
  <img src="${AGENCIA_LOGO}"/>
  <div class="hdr-right">
    <b>${esc(clienteNome || "")}</b>
    ${esc(mesRef || titulo || "Planejamento de Marketing")}
  </div>
</div>

${capaDefault}

<div class="content">
  ${blocosHtml}
</div>

<div class="page-footer">
  Documento gerado pela <b>MarketForge</b> — @marketforge_
</div>

</body>
</html>`;
}

async function findLocalChromePath(): Promise<string | undefined> {
  const fs = await import("fs");
  const candidates = [
    process.env.CHROME_EXECUTABLE_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch { /* ignora */ }
  }
  return undefined;
}

async function getBrowser() {
  const puppeteer = (await import("puppeteer-core")).default;
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true });
  }
  const localPath = await findLocalChromePath();
  if (!localPath) throw new Error("Nenhum Chrome/Edge encontrado. Defina CHROME_EXECUTABLE_PATH.");
  return puppeteer.launch({ executablePath: localPath, headless: true });
}

async function ensureBucket(admin: ReturnType<typeof createClient>) {
  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    await admin.storage.createBucket(BUCKET, { public: true });
  }
}

export async function POST(request: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada." }, { status: 500 });

  let body: PlanejamentoInput;
  try { body = await request.json(); } catch { return Response.json({ error: "Corpo inválido." }, { status: 400 }); }

  const html = buildHtml(body);
  const admin = createClient(SUPABASE_URL, serviceKey);

  let browser;
  try {
    await ensureBucket(admin);
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();
    browser = undefined;

    const slug = String(body.titulo || "planejamento").replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 40);
    const fileName = `planejamento-${body.planejamentoId || Date.now()}-${slug}.pdf`;

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(fileName, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (uploadError) return Response.json({ error: `Erro no upload: ${uploadError.message}` }, { status: 500 });

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(fileName);
    return Response.json({ pdfUrl: pub.publicUrl });
  } catch (e: any) {
    if (browser) await browser.close();
    return Response.json({ error: e?.message || "Erro ao gerar PDF." }, { status: 500 });
  }
}

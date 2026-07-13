import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = "https://jadhnzbuxgnjibymtcmn.supabase.co";
const BUCKET = "relatorios";
const AGENCIA_LOGO = "https://i.postimg.cc/jdB530mK/mkt.png";

type DiaDesempenho = { dia: string; mensagens: number };

type RelatorioInput = {
  clienteNome?: string;
  clienteLogoUrl?: string;
  campanhaNome?: string;
  objetivo?: string;
  dataInicial?: string;
  dataFinal?: string;
  dias?: number;
  valorInvestido?: number;
  valorGasto?: number | null;
  valorProduto?: number | null;
  qtdVendas?: number | null;
  desempenhoDiario?: DiaDesempenho[];
  totalMensagens?: number;
  mediaDiaria?: number;
  melhorDia?: DiaDesempenho | null;
  piorDia?: DiaDesempenho | null;
  custoPorMensagem?: number | null;
  faturamentoEstimado?: number | null;
  roi?: number | null;
  resumoExecutivo?: string;
  analiseResultados?: string;
  recomendacoes?: string[];
};

const escapeHtml = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

const fmtBRL = (n: number | null | undefined) =>
  `R$ ${Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDateBR = (d: string | undefined) => {
  if (!d) return "—";
  const [a, m, dia] = String(d).split("T")[0].split("-");
  return a && m && dia ? `${dia}/${m}/${a}` : d;
};

const barChart = (dados: DiaDesempenho[], color = "#FF6200") => {
  if (!dados?.length) return "";
  const max = Math.max(...dados.map((d) => Number(d.mensagens) || 0), 1);
  const w = 900, h = 170, padTop = 16, padBottom = 30, barGap = 8;
  const barW = Math.max(6, (w - 20) / dados.length - barGap);
  const bars = dados
    .map((d, i) => {
      const val = Number(d.mensagens) || 0;
      const barH = ((h - padTop - padBottom) * val) / max;
      const x = 10 + i * (barW + barGap);
      const y = h - padBottom - barH;
      const label = fmtDateBR(d.dia).slice(0, 5);
      return `<g>
        <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="4" fill="${color}"/>
        <text x="${x + barW / 2}" y="${y - 6}" font-size="11" fill="#1F2F46" text-anchor="middle" font-weight="700">${val}</text>
        <text x="${x + barW / 2}" y="${h - padBottom + 16}" font-size="10" fill="#64748B" text-anchor="middle">${label}</text>
      </g>`;
    })
    .join("");
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:100%;height:auto">${bars}<line x1="10" y1="${h - padBottom}" x2="${w - 10}" y2="${h - padBottom}" stroke="#DDE5EF" stroke-width="1"/></svg>`;
};

const comparativoChart = (investido: number, faturamento: number) => {
  const max = Math.max(investido, faturamento, 1);
  const w = 380, h = 170, barW = 100, baseY = 130, scale = 95;
  const hInv = (investido / max) * scale;
  const hFat = (faturamento / max) * scale;
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:320px;height:auto;margin:0 auto;display:block">
    <g>
      <rect x="55" y="${baseY - hInv}" width="${barW}" height="${hInv}" rx="6" fill="#1F2F46"/>
      <text x="${55 + barW / 2}" y="${baseY - hInv - 8}" font-size="12" fill="#1F2F46" text-anchor="middle" font-weight="800">${fmtBRL(investido)}</text>
      <text x="${55 + barW / 2}" y="${baseY + 18}" font-size="10" fill="#64748B" text-anchor="middle">Investimento</text>
    </g>
    <g>
      <rect x="${w - 55 - barW}" y="${baseY - hFat}" width="${barW}" height="${hFat}" rx="6" fill="#FF6200"/>
      <text x="${w - 55 - barW / 2}" y="${baseY - hFat - 8}" font-size="12" fill="#FF6200" text-anchor="middle" font-weight="800">${fmtBRL(faturamento)}</text>
      <text x="${w - 55 - barW / 2}" y="${baseY + 18}" font-size="10" fill="#64748B" text-anchor="middle">Faturamento</text>
    </g>
    <line x1="15" y1="${baseY}" x2="${w - 15}" y2="${baseY}" stroke="#DDE5EF" stroke-width="1"/>
  </svg>`;
};

const metricCard = (icon: string, label: string, value: string) => `
  <div class="mcard">
    <div class="mcard-icon">${icon}</div>
    <div class="mcard-label">${escapeHtml(label)}</div>
    <div class="mcard-value">${value}</div>
  </div>`;

function buildHtml(data: RelatorioInput) {
  const {
    clienteNome, clienteLogoUrl, campanhaNome, objetivo, dataInicial, dataFinal, dias,
    valorInvestido, qtdVendas, desempenhoDiario = [], totalMensagens, mediaDiaria,
    melhorDia, piorDia, custoPorMensagem, faturamentoEstimado, roi,
    resumoExecutivo, analiseResultados, recomendacoes = [],
  } = data;

  const temVendas = qtdVendas != null && qtdVendas > 0 && faturamentoEstimado != null;

  const metricCards = [
    metricCard("💰", "Valor investido", fmtBRL(valorInvestido)),
    metricCard("📅", "Dias de campanha", String(dias ?? "—")),
    metricCard("💬", "Total de mensagens", String(totalMensagens ?? 0)),
    metricCard("📊", "Média diária", String(mediaDiaria ?? 0)),
    metricCard("🔝", "Melhor dia", melhorDia ? `${fmtDateBR(melhorDia.dia)} (${melhorDia.mensagens})` : "—"),
    metricCard("🔻", "Pior dia", piorDia ? `${fmtDateBR(piorDia.dia)} (${piorDia.mensagens})` : "—"),
    metricCard("🎯", "Custo por mensagem", custoPorMensagem != null ? fmtBRL(custoPorMensagem) : "—"),
  ];
  if (qtdVendas != null) metricCards.push(metricCard("🛒", "Quantidade de vendas", String(qtdVendas)));
  if (faturamentoEstimado != null) metricCards.push(metricCard("📈", "Faturamento estimado", fmtBRL(faturamentoEstimado)));
  if (roi != null) metricCards.push(metricCard("⚡", "ROI", `${Number(roi).toFixed(1)}%`));

  const recomendacoesHtml = recomendacoes.length
    ? recomendacoes.map((r) => `<div class="rec-item"><span class="rec-check">✓</span><span>${escapeHtml(r)}</span></div>`).join("")
    : `<div class="rec-item"><span class="rec-check">✓</span><span>Manter acompanhamento contínuo dos indicadores da campanha.</span></div>`;

  const chartsHtml = temVendas
    ? `<div class="chart-section split">
        <div class="chart-card"><h3>Mensagens recebidas por dia</h3>${barChart(desempenhoDiario)}</div>
        <div class="chart-card"><h3>Investimento x Faturamento</h3>${comparativoChart(Number(valorInvestido || 0), Number(faturamentoEstimado || 0))}</div>
      </div>`
    : `<div class="chart-section">
        <div class="chart-card"><h3>Mensagens recebidas por dia</h3>${barChart(desempenhoDiario)}</div>
      </div>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1F2937; }
  .page { width: 210mm; min-height: 297mm; display: flex; flex-direction: column; page-break-after: always; }
  .page:last-child { page-break-after: auto; }

  /* HERO (topo da página 1, estilo capa) */
  .hero {
    background: linear-gradient(135deg, #1F2F46 0%, #2D4A6A 55%, #FF6200 140%);
    color: #fff; flex-shrink: 0; padding: 26px 44px;
  }
  .hero-logos { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
  .hero-logos img { height: 32px; object-fit: contain; }
  .hero-logos .sep { width: 1px; height: 24px; background: rgba(255,255,255,0.3); }
  .hero-title .tag { font-size: 10.5px; letter-spacing: 2.5px; font-weight: 700; opacity: 0.85; text-transform: uppercase; }
  .hero-title h1 { font-size: 26px; font-weight: 800; margin-top: 8px; line-height: 1.15; }
  .hero-title .campanha { font-size: 14px; font-weight: 700; margin-top: 8px; color: #FFD9B8; }
  .hero-title .objetivo { font-size: 11px; margin-top: 4px; opacity: 0.85; max-width: 600px; line-height: 1.5; }
  .hero-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.25); padding-top: 12px; margin-top: 18px; }
  .hero-footer .periodo { font-size: 11.5px; font-weight: 600; }
  .hero-footer .dias-badge { background: rgba(255,255,255,0.15); border-radius: 16px; padding: 5px 14px; font-size: 11.5px; font-weight: 700; }

  /* CONTEUDO GERAL */
  .content { padding: 22px 40px; flex: 1; }
  .section-title { font-size: 15px; font-weight: 800; color: #1F2F46; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .section-title .bar { width: 4px; height: 15px; background: #FF6200; border-radius: 3px; display: inline-block; }

  .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; margin-bottom: 16px; }
  .mcard { background: #fff; border-radius: 11px; box-shadow: 0 2px 8px rgba(31,47,70,0.08); padding: 11px 10px; border: 1px solid #EEF3F8; }
  .mcard-icon { font-size: 15px; margin-bottom: 3px; }
  .mcard-label { font-size: 8.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 2px; }
  .mcard-value { font-size: 13.5px; font-weight: 800; color: #111827; line-height: 1.25; }

  .chart-section { display: grid; grid-template-columns: 1fr; gap: 12px; }
  .chart-section.split { grid-template-columns: 1.3fr 1fr; }
  .chart-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(31,47,70,0.08); padding: 14px 16px; border: 1px solid #EEF3F8; }
  .chart-card h3 { font-size: 12px; font-weight: 800; color: #1F2F46; margin-bottom: 8px; }

  .analise-box { background: linear-gradient(135deg, #FFF7F3, #FFF); border-left: 4px solid #FF6200; border-radius: 10px; padding: 14px 18px; font-size: 12.5px; line-height: 1.6; color: #1F2937; margin-bottom: 14px; font-weight: 600; }
  .analise-p { font-size: 12px; line-height: 1.65; color: #374151; margin-bottom: 16px; text-align: justify; }

  .rec-item { display: flex; gap: 8px; align-items: flex-start; font-size: 11.5px; line-height: 1.5; color: #374151; padding: 6px 0; border-bottom: 1px solid #F1F5F9; }
  .rec-check { color: #10B981; font-weight: 800; font-size: 13px; flex-shrink: 0; }

  /* AGRADECIMENTO (rodapé da página 2, mesmo fundo escuro da capa p/ o logo ficar visível) */
  .thanks-banner {
    background: linear-gradient(135deg, #1F2F46 0%, #2D4A6A 55%, #FF6200 140%);
    color: #fff; flex-shrink: 0; text-align: center; padding: 24px 44px;
  }
  .thanks-banner img { height: 28px; margin-bottom: 10px; object-fit: contain; }
  .thanks-banner .thanks-title { font-size: 15px; font-weight: 800; margin-bottom: 6px; }
  .thanks-banner .thanks-text { font-size: 11px; line-height: 1.6; opacity: 0.9; max-width: 480px; margin: 0 auto 12px; }
  .thanks-banner .thanks-footer { font-size: 9.5px; opacity: 0.7; border-top: 1px solid rgba(255,255,255,0.25); padding-top: 10px; max-width: 480px; margin: 0 auto; }
</style>
</head>
<body>

  <div class="page">
    <div class="hero">
      <div class="hero-logos">
        <img src="${AGENCIA_LOGO}"/>
        ${clienteLogoUrl ? `<div class="sep"></div><img src="${clienteLogoUrl}"/>` : ""}
      </div>
      <div class="hero-title">
        <div class="tag">Relatório de Performance</div>
        <h1>RELATÓRIO DE TRÁFEGO PAGO</h1>
        <div class="campanha">${escapeHtml(campanhaNome)}</div>
        ${objetivo ? `<div class="objetivo">${escapeHtml(objetivo)}</div>` : ""}
      </div>
      <div class="hero-footer">
        <div class="periodo">${fmtDateBR(dataInicial)} — ${fmtDateBR(dataFinal)}${clienteNome ? ` &nbsp;·&nbsp; ${escapeHtml(clienteNome)}` : ""}</div>
        <div class="dias-badge">${dias ?? "—"} dias de campanha</div>
      </div>
    </div>
    <div class="content">
      <div class="section-title"><span class="bar"></span>Métricas da Campanha</div>
      <div class="metrics-grid">${metricCards.join("")}</div>
      ${chartsHtml}
    </div>
  </div>

  <div class="page">
    <div class="content">
      <div class="section-title"><span class="bar"></span>Análise da Campanha</div>
      ${resumoExecutivo ? `<div class="analise-box">${escapeHtml(resumoExecutivo)}</div>` : ""}
      ${analiseResultados ? `<div class="analise-p">${escapeHtml(analiseResultados).replace(/\n+/g, "<br/><br/>")}</div>` : ""}

      <div class="section-title" style="margin-top:8px"><span class="bar"></span>Próximos Passos Recomendados</div>
      <div>${recomendacoesHtml}</div>
    </div>
    <div class="thanks-banner">
      <img src="${AGENCIA_LOGO}"/>
      <div class="thanks-title">Obrigado pela confiança!</div>
      <div class="thanks-text">Este relatório reflete os resultados da campanha no período analisado. Seguimos à disposição para acompanhar de perto a evolução dos indicadores e apoiar as próximas decisões estratégicas.</div>
      <div class="thanks-footer">Relatório gerado automaticamente pelo sistema da MarketForge</div>
    </div>
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
    try {
      if (fs.existsSync(c)) return c;
    } catch {
      // ignora
    }
  }
  return undefined;
}

async function getBrowser() {
  const puppeteer = (await import("puppeteer-core")).default;
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const localPath = await findLocalChromePath();
  if (!localPath) {
    throw new Error(
      "Nenhum Chrome/Edge encontrado localmente para gerar o PDF em ambiente de desenvolvimento. Defina a variável de ambiente CHROME_EXECUTABLE_PATH apontando para o executável do Chrome ou Edge."
    );
  }
  return puppeteer.launch({ executablePath: localPath, headless: true });
}

async function ensureBucket(admin: ReturnType<typeof createClient>) {
  const { data: buckets } = await admin.storage.listBuckets();
  const existe = buckets?.some((b) => b.name === BUCKET);
  if (!existe) {
    await admin.storage.createBucket(BUCKET, { public: true });
  }
}

export async function POST(request: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor." }, { status: 500 });
  }

  let body: RelatorioInput & { relatorioId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

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

    const fileName = `relatorio-${(body.relatorioId || Date.now())}-${path.basename(String(body.campanhaNome || "campanha")).replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`;

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(fileName, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (uploadError) {
      return Response.json({ error: `Erro ao enviar PDF para o Storage: ${uploadError.message}` }, { status: 500 });
    }

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(fileName);
    return Response.json({ pdfUrl: pub.publicUrl });
  } catch (e: any) {
    if (browser) await browser.close();
    return Response.json({ error: e?.message || "Erro ao gerar o PDF." }, { status: 500 });
  }
}

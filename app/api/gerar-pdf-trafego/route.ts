import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import path from "path";

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
  const w = 900, h = 260, padTop = 20, padBottom = 40, barGap = 8;
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
  const w = 500, h = 220, barW = 140;
  const hInv = (investido / max) * 140;
  const hFat = (faturamento / max) * 140;
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:420px;height:auto;margin:0 auto;display:block">
    <g>
      <rect x="90" y="${160 - hInv}" width="${barW}" height="${hInv}" rx="6" fill="#1F2F46"/>
      <text x="${90 + barW / 2}" y="${160 - hInv - 10}" font-size="14" fill="#1F2F46" text-anchor="middle" font-weight="800">${fmtBRL(investido)}</text>
      <text x="${90 + barW / 2}" y="182" font-size="12" fill="#64748B" text-anchor="middle">Investimento</text>
    </g>
    <g>
      <rect x="270" y="${160 - hFat}" width="${barW}" height="${hFat}" rx="6" fill="#FF6200"/>
      <text x="${270 + barW / 2}" y="${160 - hFat - 10}" font-size="14" fill="#FF6200" text-anchor="middle" font-weight="800">${fmtBRL(faturamento)}</text>
      <text x="${270 + barW / 2}" y="182" font-size="12" fill="#64748B" text-anchor="middle">Faturamento</text>
    </g>
    <line x1="20" y1="160" x2="${w - 20}" y2="160" stroke="#DDE5EF" stroke-width="1"/>
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

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1F2937; }
  .page { width: 210mm; min-height: 297mm; padding: 0; position: relative; page-break-after: always; overflow: hidden; }
  .page:last-child { page-break-after: auto; }

  /* CAPA */
  .capa {
    background: linear-gradient(135deg, #1F2F46 0%, #2D4A6A 55%, #FF6200 140%);
    color: #fff; display: flex; flex-direction: column; justify-content: space-between;
    height: 297mm; padding: 50px 55px;
  }
  .capa-logos { display: flex; align-items: center; gap: 22px; }
  .capa-logos img { height: 46px; object-fit: contain; }
  .capa-logos .sep { width: 1px; height: 34px; background: rgba(255,255,255,0.3); }
  .capa-mid { margin-top: 90px; }
  .capa-mid .tag { font-size: 13px; letter-spacing: 3px; font-weight: 700; opacity: 0.85; text-transform: uppercase; }
  .capa-mid h1 { font-size: 42px; font-weight: 800; margin-top: 14px; line-height: 1.15; max-width: 620px; }
  .capa-mid .campanha { font-size: 22px; font-weight: 700; margin-top: 26px; color: #FFD9B8; }
  .capa-mid .objetivo { font-size: 13px; margin-top: 10px; opacity: 0.85; max-width: 560px; line-height: 1.6; }
  .capa-footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(255,255,255,0.25); padding-top: 20px; }
  .capa-footer .periodo { font-size: 13px; font-weight: 600; }
  .capa-footer .dias-badge { background: rgba(255,255,255,0.15); border-radius: 20px; padding: 8px 18px; font-size: 13px; font-weight: 700; }

  /* CONTEUDO GERAL */
  .content { padding: 46px 50px; }
  .section-title { font-size: 20px; font-weight: 800; color: #1F2F46; margin-bottom: 22px; display: flex; align-items: center; gap: 10px; }
  .section-title .bar { width: 5px; height: 22px; background: #FF6200; border-radius: 3px; display: inline-block; }

  .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 32px; }
  .mcard { background: #fff; border-radius: 14px; box-shadow: 0 2px 10px rgba(31,47,70,0.08); padding: 18px 16px; border: 1px solid #EEF3F8; }
  .mcard-icon { font-size: 20px; margin-bottom: 6px; }
  .mcard-label { font-size: 10.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
  .mcard-value { font-size: 18px; font-weight: 800; color: #111827; }

  .chart-card { background: #fff; border-radius: 14px; box-shadow: 0 2px 10px rgba(31,47,70,0.08); padding: 24px; border: 1px solid #EEF3F8; margin-bottom: 24px; }
  .chart-card h3 { font-size: 14px; font-weight: 800; color: #1F2F46; margin-bottom: 16px; }

  .analise-box { background: linear-gradient(135deg, #FFF7F3, #FFF); border-left: 4px solid #FF6200; border-radius: 10px; padding: 22px 26px; font-size: 14px; line-height: 1.8; color: #1F2937; margin-bottom: 26px; font-weight: 600; }
  .analise-p { font-size: 13.5px; line-height: 1.9; color: #374151; margin-bottom: 26px; text-align: justify; }

  .rec-item { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; line-height: 1.6; color: #374151; padding: 10px 0; border-bottom: 1px solid #F1F5F9; }
  .rec-check { color: #10B981; font-weight: 800; font-size: 15px; flex-shrink: 0; }

  .final-page { height: 297mm; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: #F8FAFC; padding: 60px; }
  .final-page img { height: 40px; margin-bottom: 34px; }
  .final-page h2 { font-size: 24px; font-weight: 800; color: #1F2F46; margin-bottom: 16px; }
  .final-page p { font-size: 14px; color: #64748B; max-width: 480px; line-height: 1.8; margin-bottom: 40px; }
  .final-footer { font-size: 11px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 16px; width: 100%; max-width: 480px; }
</style>
</head>
<body>

  <div class="page capa">
    <div class="capa-logos">
      <img src="${AGENCIA_LOGO}"/>
      ${clienteLogoUrl ? `<div class="sep"></div><img src="${clienteLogoUrl}"/>` : ""}
    </div>
    <div class="capa-mid">
      <div class="tag">Relatório de Performance</div>
      <h1>RELATÓRIO DE<br/>TRÁFEGO PAGO</h1>
      <div class="campanha">${escapeHtml(campanhaNome)}</div>
      ${objetivo ? `<div class="objetivo">${escapeHtml(objetivo)}</div>` : ""}
    </div>
    <div class="capa-footer">
      <div class="periodo">${fmtDateBR(dataInicial)} — ${fmtDateBR(dataFinal)}${clienteNome ? ` &nbsp;·&nbsp; ${escapeHtml(clienteNome)}` : ""}</div>
      <div class="dias-badge">${dias ?? "—"} dias de campanha</div>
    </div>
  </div>

  <div class="page">
    <div class="content">
      <div class="section-title"><span class="bar"></span>Métricas da Campanha</div>
      <div class="metrics-grid">${metricCards.join("")}</div>

      <div class="chart-card">
        <h3>Mensagens recebidas por dia</h3>
        ${barChart(desempenhoDiario)}
      </div>

      ${temVendas ? `<div class="chart-card"><h3>Investimento x Faturamento</h3>${comparativoChart(Number(valorInvestido || 0), Number(faturamentoEstimado || 0))}</div>` : ""}
    </div>
  </div>

  <div class="page">
    <div class="content">
      <div class="section-title"><span class="bar"></span>Análise da Campanha</div>
      ${resumoExecutivo ? `<div class="analise-box">${escapeHtml(resumoExecutivo)}</div>` : ""}
      ${analiseResultados ? `<div class="analise-p">${escapeHtml(analiseResultados).replace(/\n+/g, "<br/><br/>")}</div>` : ""}

      <div class="section-title" style="margin-top:12px"><span class="bar"></span>Próximos Passos Recomendados</div>
      <div>${recomendacoesHtml}</div>
    </div>
  </div>

  <div class="page final-page">
    <img src="${AGENCIA_LOGO}"/>
    <h2>Obrigado pela confiança!</h2>
    <p>Este relatório reflete os resultados da campanha no período analisado. Seguimos à disposição para acompanhar de perto a evolução dos indicadores e apoiar as próximas decisões estratégicas.</p>
    <div class="final-footer">Relatório gerado automaticamente pelo sistema da MarketForge</div>
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

// app/api/push-notify/route.ts
// Chamada pelo cron a cada 3h — envia notificações push para admin/colaboradores
// sobre cobranças pendentes/atrasadas

import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = "https://jadhnzbuxgnjibymtcmn.supabase.co";

webpush.setVapidDetails(
  "mailto:contato@marketforge.com.br",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  // Autenticação simples por token secreto (chame do cron com Authorization: Bearer <CRON_SECRET>)
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(SUPABASE_URL, serviceKey);

  // Busca cobranças pendentes/atrasadas
  const { data: cobr } = await admin
    .from("cobrancas")
    .select("cliente, valor, status, vencimento")
    .in("status", ["pendente", "atrasado"]);

  if (!cobr || cobr.length === 0) {
    return Response.json({ sent: 0, msg: "Sem cobranças pendentes." });
  }

  const atrasadas = cobr.filter((c) => c.status === "atrasado").length;
  const pendentes = cobr.filter((c) => c.status === "pendente").length;

  const title = atrasadas > 0
    ? `⚠️ ${atrasadas} cobrança${atrasadas > 1 ? "s" : ""} atrasada${atrasadas > 1 ? "s" : ""}`
    : `📋 ${pendentes} cobrança${pendentes > 1 ? "s" : ""} pendente${pendentes > 1 ? "s" : ""}`;

  const body = cobr
    .slice(0, 3)
    .map((c) => `${c.cliente} — R$ ${Number(c.valor).toFixed(2).replace(".", ",")} (${c.status})`)
    .join("\n") + (cobr.length > 3 ? `\n+${cobr.length - 3} mais` : "");

  // Busca todas as subscriptions de admin/colaborador
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("subscription");

  if (!subs || subs.length === 0) {
    return Response.json({ sent: 0, msg: "Sem subscriptions cadastradas." });
  }

  let sent = 0;
  const payload = JSON.stringify({ title, body, icon: "https://i.postimg.cc/jdB530mK/mkt.png", url: "/", tag: "mf-cobr" });

  for (const row of subs) {
    try {
      const sub = typeof row.subscription === "string" ? JSON.parse(row.subscription) : row.subscription;
      await webpush.sendNotification(sub, payload);
      sent++;
    } catch (e: any) {
      // Subscription expirada — remove
      if (e.statusCode === 410 || e.statusCode === 404) {
        await admin.from("push_subscriptions").delete().eq("subscription", JSON.stringify(row.subscription));
      }
    }
  }

  return Response.json({ sent, total: subs.length });
}

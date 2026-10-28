-- ══════════════════════════════════════════════════════════════════════════════
-- MarketForge — Notificações Push: tabela push_subscriptions
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- RLS: cada usuário gerencia apenas a própria subscription
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_sub_own" ON public.push_subscriptions;
CREATE POLICY "push_sub_own" ON public.push_subscriptions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role (server-side) pode ler todas para enviar as notificações
-- (o service_role bypassa RLS automaticamente, sem necessidade de policy extra)

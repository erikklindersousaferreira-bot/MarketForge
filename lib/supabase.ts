// lib/supabase.ts — cliente singleton para o browser
// IMPORTANTE: usar createBrowserClient do @supabase/ssr.
// Ele salva a sessão em COOKIES, que o servidor (layout do dashboard e proxy) consegue ler.
// O createClient do @supabase/supabase-js salva no localStorage e o servidor nunca enxerga a sessão.
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

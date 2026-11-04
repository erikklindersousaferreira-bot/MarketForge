// lib/supabase.ts
// Singleton do cliente Supabase para o browser.
// Usa @supabase/ssr para salvar a sessão em cookies
// (necessário para o proxy.ts conseguir ler a autenticação).
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

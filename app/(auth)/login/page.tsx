"use client";

// app/(auth)/login/page.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [debug, setDebug] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setDebug("1. Iniciando login...");
    setCarregando(true);

    try {
      setDebug("2. Chamando signInWithPassword...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      setDebug(`3. Auth: data.user=${data?.user?.id ?? "null"}, error=${error?.message ?? "nenhum"}`);

      if (error || !data.user) {
        setErro("E-mail ou senha incorretos. Tente novamente.");
        setCarregando(false);
        return;
      }

      setDebug(`4. Autenticado! Buscando usuário id=${data.user.id}...`);

      const { data: usuario, error: errUsuario } = await supabase
        .from("usuarios")
        .select("papel, primeiro_acesso")
        .eq("id", data.user.id)
        .single();

      setDebug(`5. usuarios query: papel=${usuario?.papel ?? "null"}, primeiro_acesso=${usuario?.primeiro_acesso ?? "null"}, error=${errUsuario?.message ?? "nenhum"}`);

      if (usuario?.primeiro_acesso) {
        setDebug("6. Redirecionando para /redefinir-senha");
        window.location.href = "/redefinir-senha";
        return;
      }

      if (usuario?.papel === "cliente") {
        setDebug("6. Redirecionando para /portal");
        window.location.href = "/portal";
        return;
      }

      setDebug("6. Redirecionando para /painel");
      window.location.href = "/painel";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDebug(`ERRO: ${msg}`);
      setErro("Ocorreu um erro. Tente novamente.");
      setCarregando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F7F7F8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.625rem",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "#FF6A00",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                  fill="white"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "#181818",
                letterSpacing: "-0.02em",
              }}
            >
              MarketForge
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "#71717A", margin: 0 }}>
            Faça login para continuar
          </p>
        </div>

        {/* Card de login */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #E9E9EC",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.07)",
            padding: "2rem",
          }}
        >
          <form onSubmit={handleLogin}>
            {/* Campo email */}
            <div style={{ marginBottom: "1rem" }}>
              <label className="mf-label" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                className="mf-input"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Campo senha */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label className="mf-label" htmlFor="senha">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                className="mf-input"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {/* Debug temporário */}
            {debug && (
              <div
                style={{
                  background: "#F0F9FF",
                  border: "1px solid #BAE6FD",
                  borderRadius: 8,
                  padding: "0.75rem 1rem",
                  color: "#0369A1",
                  fontSize: "0.75rem",
                  marginBottom: "1rem",
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                }}
              >
                {debug}
              </div>
            )}

            {/* Mensagem de erro */}
            {erro && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  padding: "0.75rem 1rem",
                  color: "#DC2626",
                  fontSize: "0.875rem",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {erro}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              className="mf-btn-primary"
              disabled={carregando}
              style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}
            >
              {carregando ? (
                <>
                  <div className="mf-spinner" style={{ width: 16, height: 16 }} />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            color: "#71717A",
            marginTop: "1.5rem",
          }}
        >
          Não tem acesso? Entre em contato com o administrador.
        </p>
      </div>
    </div>
  );
}

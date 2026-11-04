"use client";

// app/(auth)/login/page.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error || !data.user) {
        setErro("E-mail ou senha incorretos. Tente novamente.");
        setCarregando(false);
        return;
      }

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("papel, primeiro_acesso")
        .eq("id", data.user.id)
        .single();

      if (usuario?.primeiro_acesso) {
        window.location.href = "/redefinir-senha";
        return;
      }

      if (usuario?.papel === "cliente") {
        window.location.href = "/portal";
        return;
      }

      window.location.href = "/painel";
    } catch {
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-escura.png"
            alt="MarketForge"
            className="mf-logo-img"
            style={{ width: 220, margin: "0 auto 0.75rem" }}
          />
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

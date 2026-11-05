"use client";

// app/redefinir-senha/page.tsx — Troca de senha no primeiro acesso
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RedefinirSenhaPage() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleRedefinir(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (novaSenha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });

      if (error) {
        setErro(
          /different|same/i.test(error.message)
            ? "A nova senha precisa ser diferente da senha temporária."
            : "Erro ao redefinir senha. Tente novamente."
        );
        return;
      }

      // Marca o primeiro acesso como concluído (no servidor)
      const res = await fetch("/api/conta/primeiro-acesso", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível concluir. Tente novamente.");
        return;
      }

      // Recarrega a página inteira para o servidor ler a sessão nova
      window.location.href = data.destino ?? "/painel";
      return;
    } catch {
      setErro("Ocorreu um erro. Tente novamente.");
    } finally {
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
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #E9E9EC",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.07)",
            padding: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#181818",
              margin: "0 0 0.5rem",
            }}
          >
            Defina sua senha
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#71717A",
              margin: "0 0 1.5rem",
            }}
          >
            É o seu primeiro acesso. Crie uma senha segura para continuar.
          </p>

          <form onSubmit={handleRedefinir}>
            <div style={{ marginBottom: "1rem" }}>
              <label className="mf-label" htmlFor="nova-senha">
                Nova senha
              </label>
              <input
                id="nova-senha"
                type="password"
                className="mf-input"
                placeholder="Mínimo 8 caracteres"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label className="mf-label" htmlFor="confirmar-senha">
                Confirmar senha
              </label>
              <input
                id="confirmar-senha"
                type="password"
                className="mf-input"
                placeholder="Repita a senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />
            </div>

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
                }}
              >
                {erro}
              </div>
            )}

            <button
              type="submit"
              className="mf-btn-primary"
              disabled={carregando}
              style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}
            >
              {carregando ? "Salvando..." : "Salvar senha e entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

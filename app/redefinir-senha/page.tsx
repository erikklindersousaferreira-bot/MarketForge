"use client";

// app/redefinir-senha/page.tsx — Troca de senha no primeiro acesso
import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

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
        setErro("Erro ao redefinir senha. Tente novamente.");
        return;
      }

      // Marcar primeiro_acesso como false
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("usuarios")
          .update({ primeiro_acesso: false })
          .eq("id", user.id);

        const { data: usuario } = await supabase
          .from("usuarios")
          .select("papel")
          .eq("id", user.id)
          .single();

        if (usuario?.papel === "cliente") {
          router.push("/portal");
        } else {
          router.push("/painel");
        }
      }
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
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
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

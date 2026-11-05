"use client";

// components/ui/UploadLogo.tsx — Escolher foto/logo (galeria ou câmera), comprimir e enviar ao Storage
import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { comprimirImagem } from "@/lib/imagem";

type Props = {
  valor: string | null;
  nome: string;
  pasta?: string;              // ex.: "clientes"
  onChange: (url: string | null) => void;
};

function iniciais(n: string) {
  return (n || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
}

export function UploadLogo({ valor, nome, pasta = "clientes", onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [info, setInfo] = useState("");

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setErro(""); setInfo(""); setEnviando(true);
    try {
      const { blob, tipo, extensao } = await comprimirImagem(arquivo, { tamanhoMax: 512, qualidade: 0.82 });
      const caminho = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensao}`;
      const { error } = await supabase.storage.from("logos").upload(caminho, blob, {
        contentType: tipo,
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) {
        console.error("[upload logo]", error);
        setErro(/bucket|not found/i.test(error.message)
          ? "Armazenamento de fotos não configurado. Rode a etapa 14 do banco."
          : "Não foi possível enviar a foto. Tente de novo.");
        return;
      }
      const { data } = supabase.storage.from("logos").getPublicUrl(caminho);
      onChange(data.publicUrl);
      setInfo(`Foto otimizada: ${(arquivo.size / 1024 / 1024).toFixed(1).replace(".", ",")} MB → ${Math.max(1, Math.round(blob.size / 1024))} KB`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao processar a imagem.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={enviando}
        aria-label="Escolher foto"
        style={{
          width: 76, height: 76, borderRadius: "50%", flexShrink: 0, padding: 3, border: "none", cursor: "pointer",
          background: "conic-gradient(#FF6A00, #F59E0B, #FF6A00)", position: "relative",
        }}
      >
        <span style={{ display: "flex", width: "100%", height: "100%", borderRadius: "50%", background: "#fff", padding: 2 }}>
          {valor ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={valor} alt={nome} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <span style={{ flex: 1, borderRadius: "50%", background: "#F4F4F5", color: "#71717A", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20 }}>
              {nome ? iniciais(nome) : "📷"}
            </span>
          )}
        </span>
        {enviando && (
          <span style={{ position: "absolute", inset: 3, borderRadius: "50%", background: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="mf-spinner" style={{ width: 22, height: 22 }} />
          </span>
        )}
        <span style={{ position: "absolute", right: -2, bottom: -2, width: 26, height: 26, borderRadius: "50%", background: "#FF6A00", color: "#fff", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>+</span>
      </button>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Foto / logo do cliente</div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: 4, flexWrap: "wrap" }}>
          <button type="button" onClick={() => input.current?.click()} disabled={enviando}
            style={{ border: "none", background: "none", padding: 0, color: "var(--mf-laranja)", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>
            {enviando ? "Otimizando..." : valor ? "Trocar foto" : "Escolher foto"}
          </button>
          {valor && !enviando && (
            <button type="button" onClick={() => { onChange(null); setInfo(""); }}
              style={{ border: "none", background: "none", padding: 0, color: "var(--mf-texto-sec)", fontSize: "0.8125rem", cursor: "pointer" }}>
              Remover
            </button>
          )}
        </div>
        {info && <div style={{ fontSize: "0.75rem", color: "#16A34A", marginTop: 4 }}>{info}</div>}
        {erro && <div style={{ fontSize: "0.75rem", color: "var(--mf-vermelho)", marginTop: 4 }}>{erro}</div>}
        {!info && !erro && <div style={{ fontSize: "0.75rem", color: "var(--mf-texto-desab)", marginTop: 4 }}>Pode ser foto da galeria ou da câmera. O sistema deixa leve sozinho.</div>}
      </div>

      <input ref={input} type="file" accept="image/*" onChange={escolher} style={{ display: "none" }} />
    </div>
  );
}

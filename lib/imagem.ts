// lib/imagem.ts — Reduz e comprime fotos no navegador antes de enviar (logo, avatar)

/**
 * Redimensiona a imagem para caber em `tamanhoMax` px (lado maior), recorta em quadrado
 * se `quadrado` for true, e comprime em WebP (ou JPEG, se o navegador não suportar).
 * Uma foto de celular de 4 MB vira algo em torno de 30–80 KB.
 */
export async function comprimirImagem(
  arquivo: File,
  { tamanhoMax = 512, qualidade = 0.82, quadrado = true }: { tamanhoMax?: number; qualidade?: number; quadrado?: boolean } = {}
): Promise<{ blob: Blob; tipo: string; extensao: string }> {
  if (!arquivo.type.startsWith("image/")) {
    throw new Error("Escolha um arquivo de imagem (JPG, PNG, WebP...).");
  }

  const bitmap = await carregar(arquivo);
  const larguraOrig = bitmap.width;
  const alturaOrig = bitmap.height;

  // Recorte central em quadrado (fica bonito na bolinha)
  let sx = 0, sy = 0, sw = larguraOrig, sh = alturaOrig;
  if (quadrado) {
    const lado = Math.min(larguraOrig, alturaOrig);
    sx = (larguraOrig - lado) / 2;
    sy = (alturaOrig - lado) / 2;
    sw = sh = lado;
  }

  const escala = Math.min(1, tamanhoMax / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * escala));
  const h = Math.max(1, Math.round(sh * escala));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu processar a imagem.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // Fundo branco: logos PNG transparentes não ficam pretas no JPEG
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap as CanvasImageSource, sx, sy, sw, sh, 0, 0, w, h);
  if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

  const webp = await paraBlob(canvas, "image/webp", qualidade);
  if (webp && webp.type === "image/webp") return { blob: webp, tipo: "image/webp", extensao: "webp" };

  const jpeg = await paraBlob(canvas, "image/jpeg", qualidade);
  if (!jpeg) throw new Error("Não foi possível comprimir a imagem.");
  return { blob: jpeg, tipo: "image/jpeg", extensao: "jpg" };
}

async function carregar(arquivo: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      // Respeita a rotação da foto do celular (EXIF)
      return await createImageBitmap(arquivo, { imageOrientation: "from-image" } as ImageBitmapOptions);
    } catch { /* cai no método abaixo */ }
  }
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Não foi possível abrir essa imagem. Tente uma foto JPG ou PNG.")); };
    img.src = url;
  });
}

function paraBlob(canvas: HTMLCanvasElement, tipo: string, qualidade: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), tipo, qualidade));
}

// Marca d'água "queimada" na prévia: texto ou logo (PNG), com opacidade e posição.
// Cor fixa de propósito no texto (é pixel da foto, não interface): branco com contorno escuro,
// para aparecer em foto clara e escura.
export type WatermarkPosition = "center" | "tiled" | "bottom-right";
export type WatermarkSpec = {
  text: string | null;
  image: ImageBitmap | null; // tem prioridade sobre o texto
  opacity: number; // 0–100
  position: WatermarkPosition;
};

type Ctx2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

export function drawWatermark(ctx: Ctx2D, w: number, h: number, spec: WatermarkSpec) {
  if (!spec.image && !spec.text) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(100, spec.opacity)) / 100;
  if (spec.image) drawImageMark(ctx, w, h, spec.image, spec.position);
  else drawTextMark(ctx, w, h, spec.text!, spec.position);
  ctx.restore();
}

function drawImageMark(ctx: Ctx2D, w: number, h: number, img: ImageBitmap, pos: WatermarkPosition) {
  const short = Math.min(w, h);
  // largura do logo: 40% do lado menor no centro, 18% no canto ou repetido
  const target = short * (pos === "center" ? 0.4 : 0.18);
  const scale = target / Math.max(img.width, img.height);
  const mw = img.width * scale;
  const mh = img.height * scale;
  const margin = short * 0.04;
  if (pos === "center") {
    ctx.drawImage(img, (w - mw) / 2, (h - mh) / 2, mw, mh);
  } else if (pos === "bottom-right") {
    ctx.drawImage(img, w - mw - margin, h - mh - margin, mw, mh);
  } else {
    for (let y = margin; y < h; y += mh * 2.2) {
      const shift = (Math.round(y / (mh * 2.2)) % 2) * mw * 1.1;
      for (let x = margin - shift; x < w; x += mw * 2.2) ctx.drawImage(img, x, y, mw, mh);
    }
  }
}

function drawTextMark(ctx: Ctx2D, w: number, h: number, text: string, pos: WatermarkPosition) {
  const short = Math.min(w, h);
  const size = Math.max(14, Math.round(short * (pos === "center" ? 0.08 : 0.045)));
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.strokeStyle = "rgba(0,0,0,0.45)";
  ctx.lineWidth = Math.max(1, size / 18);
  ctx.textBaseline = "middle";
  const mark = (x: number, y: number) => { ctx.strokeText(text, x, y); ctx.fillText(text, x, y); };
  if (pos === "center") {
    ctx.textAlign = "center";
    mark(w / 2, h / 2);
  } else if (pos === "bottom-right") {
    ctx.textAlign = "right";
    mark(w - short * 0.04, h - short * 0.04 - size / 2);
  } else {
    ctx.textAlign = "center";
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 7);
    const stepX = ctx.measureText(text).width + size * 3;
    const stepY = size * 4.5;
    const reach = Math.hypot(w, h);
    for (let y = -reach / 2; y < reach / 2; y += stepY) {
      const offset = (Math.round(y / stepY) % 2) * (stepX / 2);
      for (let x = -reach / 2 - offset; x < reach / 2; x += stepX) mark(x, y);
    }
  }
}

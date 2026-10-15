// Marca d'água "queimada" na prévia: texto em diagonal, repetido.
// Cor fixa de propósito (é pixel da foto, não interface): branco translúcido com contorno escuro,
// para aparecer tanto em foto clara quanto escura.
const FILL = "rgba(255,255,255,0.32)";
const STROKE = "rgba(0,0,0,0.18)";

type Ctx2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

export function drawWatermark(ctx: Ctx2D, w: number, h: number, text: string) {
  const size = Math.max(14, Math.round(Math.min(w, h) * 0.045));
  ctx.save();
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.fillStyle = FILL;
  ctx.strokeStyle = STROKE;
  ctx.lineWidth = Math.max(1, size / 18);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 7);
  const stepX = ctx.measureText(text).width + size * 3;
  const stepY = size * 4.5;
  const reach = Math.hypot(w, h);
  for (let y = -reach / 2; y < reach / 2; y += stepY) {
    const offset = (Math.round(y / stepY) % 2) * (stepX / 2);
    for (let x = -reach / 2 - offset; x < reach / 2; x += stepX) {
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    }
  }
  ctx.restore();
}

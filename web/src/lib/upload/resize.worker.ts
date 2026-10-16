/// <reference lib="webworker" />
// Roda fora da tela principal: lê a foto, gera prévia (1600px) e miniatura (400px),
// aplica a marca d'água na prévia e na miniatura e devolve JPEGs prontos para enviar.
import { drawWatermark, type WatermarkPosition } from "./watermark";

export type WatermarkConfig = { text: string | null; image: Blob | null; opacity: number; position: WatermarkPosition };
export type ResizeRequest = { id: string; file: File; watermark: WatermarkConfig | null; maxSide?: number };
export type ResizeResponse =
  | { id: string; ok: true; preview: Blob; thumb: Blob; width: number; height: number }
  | { id: string; ok: false; error: string };

const PREVIEW = 1600;
const THUMB = 400;
let logo: { blob: Blob; bitmap: ImageBitmap } | null = null; // decodificado uma vez por worker

async function logoBitmap(blob: Blob) {
  if (logo?.blob !== blob) logo = { blob, bitmap: await createImageBitmap(blob) };
  return logo.bitmap;
}

async function render(bitmap: ImageBitmap, max: number, wm: WatermarkConfig | null, quality: number) {
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  if (wm) drawWatermark(ctx, w, h, { text: wm.text, image: wm.image ? await logoBitmap(wm.image) : null, opacity: wm.opacity, position: wm.position });
  return { blob: await canvas.convertToBlob({ type: "image/jpeg", quality }), w, h };
}

self.onmessage = async (e: MessageEvent<ResizeRequest>) => {
  const { id, file, watermark, maxSide } = e.data;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const preview = await render(bitmap, maxSide ?? PREVIEW, watermark, 0.82);
    const thumb = await render(bitmap, THUMB, watermark, 0.75);
    bitmap.close();
    const res: ResizeResponse = { id, ok: true, preview: preview.blob, thumb: thumb.blob, width: preview.w, height: preview.h };
    self.postMessage(res);
  } catch {
    self.postMessage({ id, ok: false, error: "Não deu para ler esta imagem" } satisfies ResizeResponse);
  }
};

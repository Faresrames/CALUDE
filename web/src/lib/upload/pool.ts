"use client";
import type { ResizeRequest, ResizeResponse } from "./resize.worker";

/** Fila de workers: no máximo N fotos sendo processadas ao mesmo tempo. */
export function createResizePool(size = Math.min(4, Math.max(2, (navigator.hardwareConcurrency || 4) - 1))) {
  const workers = Array.from({ length: size }, () => new Worker(new URL("./resize.worker.ts", import.meta.url), { type: "module" }));
  const idle = [...workers];
  const waiting: (() => void)[] = [];

  async function run(req: ResizeRequest): Promise<ResizeResponse> {
    while (!idle.length) await new Promise<void>((r) => waiting.push(r));
    const w = idle.pop()!;
    try {
      return await new Promise<ResizeResponse>((resolve) => {
        w.onmessage = (e: MessageEvent<ResizeResponse>) => resolve(e.data);
        w.onerror = () => resolve({ id: req.id, ok: false, error: "Falha ao processar" });
        w.postMessage(req);
      });
    } finally {
      idle.push(w);
      waiting.shift()?.();
    }
  }

  return { run, close: () => workers.forEach((w) => w.terminate()) };
}

/** PUT com progresso (fetch não informa progresso de envio). */
export function putWithProgress(url: string, blob: Blob, onProgress: (fraction: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", "image/jpeg");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("rede"));
    xhr.send(blob);
  });
}

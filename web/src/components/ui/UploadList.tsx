"use client";
import { clsx } from "clsx";
import { AlertCircle, CheckCircle2, ImageUp, RotateCcw } from "lucide-react";
import { useId, useState } from "react";

export type UploadItem = { id: string; name: string; progress: number; status: "queued" | "uploading" | "done" | "error"; error?: string };

export function Dropzone({ onFiles, disabled }: { onFiles: (files: File[]) => void; disabled?: boolean }) {
  const id = useId();
  const [over, setOver] = useState(false);
  return (
    <label
      htmlFor={id}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled) onFiles(Array.from(e.dataTransfer.files));
      }}
      className={clsx(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors",
        over ? "border-focus bg-surface" : "border-line-input bg-raised hover:bg-surface",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <ImageUp aria-hidden className="size-8 text-muted" />
      <span className="text-base font-semibold text-ink">Arraste as fotos aqui ou clique para escolher</span>
      <span className="text-sm text-muted">JPEG ou PNG. Pode mandar o evento inteiro: a gente reduz e aplica a marca d’água antes de enviar.</span>
      <input id={id} type="file" multiple accept="image/jpeg,image/png" disabled={disabled} className="sr-only"
        onChange={(e) => onFiles(Array.from(e.target.files ?? []))} />
    </label>
  );
}

export function UploadList({ items, onRetry }: { items: UploadItem[]; onRetry?: (id: string) => void }) {
  const done = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "error").length;
  return (
    <section aria-label="Envio de fotos" className="rounded-lg border border-line bg-raised">
      <header className="flex items-center justify-between border-b border-line px-4 py-3 text-sm">
        <span className="font-semibold text-ink" role="status" aria-live="polite">
          {done} de {items.length} enviadas
        </span>
        {failed > 0 && <span className="text-danger">{failed} com erro</span>}
      </header>
      <ul className="max-h-72 divide-y divide-line overflow-auto">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-3 px-4 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate text-ink">{it.name}</span>
            {it.status === "uploading" || it.status === "queued" ? (
              <span className="flex w-32 items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-pill bg-surface">
                  <span className="block h-full bg-info" style={{ width: `${it.progress}%` }} />
                </span>
                <span className="w-9 text-right text-xs text-muted">{it.status === "queued" ? "fila" : `${it.progress}%`}</span>
              </span>
            ) : it.status === "done" ? (
              <CheckCircle2 aria-label="Enviada" className="size-4 text-success" />
            ) : (
              <span className="flex items-center gap-2 text-danger">
                <AlertCircle aria-hidden className="size-4" />
                <span className="text-xs">{it.error ?? "Falhou"}</span>
                {onRetry && (
                  <button type="button" onClick={() => onRetry(it.id)} aria-label={`Tentar de novo ${it.name}`}
                    className="grid size-7 place-items-center rounded-sm text-ink hover:bg-surface">
                    <RotateCcw aria-hidden className="size-3.5" />
                  </button>
                )}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

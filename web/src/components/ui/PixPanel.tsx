"use client";
import { clsx } from "clsx";
import { Check, Copy, QrCode } from "lucide-react";
import { useState } from "react";
import { formatBRL } from "./SelectionCounter";

export type PixStatus = "pending" | "paid" | "expired";

/** Pagamento das fotos extras por PIX. O QR real entra no /replica-build (lib de QR a partir do payload). */
export function PixPanel({ amountCents, extras, payload, status, photographerName }: {
  amountCents: number;
  extras: number;
  payload: string;
  status: PixStatus;
  photographerName: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-line bg-raised p-5 shadow-card" aria-label="Pagamento por PIX">
      <div>
        <p className="text-sm text-muted">{extras} fotos extras</p>
        <p className="font-display text-xl text-ink">{formatBRL(amountCents)}</p>
        <p className="text-sm text-muted">O PIX vai direto para {photographerName}.</p>
      </div>
      {status === "pending" && (
        <>
          <div className="grid aspect-square w-44 place-items-center self-center rounded-md border border-line bg-surface text-muted">
            <QrCode aria-label="QR Code do PIX" className="size-24" />
          </div>
          <div className="flex gap-2">
            <input readOnly value={payload} aria-label="PIX copia e cola"
              className="h-10 min-w-0 flex-1 rounded-md border border-line-input bg-surface px-3 font-mono text-xs text-ink" />
            <button type="button"
              onClick={async () => { await navigator.clipboard.writeText(payload); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="inline-flex h-10 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-semibold text-on-accent">
              {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="text-xs text-muted">Depois de pagar, o fotógrafo confirma e você recebe um e-mail.</p>
        </>
      )}
      <p role="status" className={clsx("text-sm font-semibold",
        status === "paid" ? "text-success" : status === "expired" ? "text-danger" : "text-warning")}>
        {status === "paid" ? "Pagamento confirmado" : status === "expired" ? "Este PIX expirou. Gere outro." : "Aguardando pagamento"}
      </p>
    </section>
  );
}

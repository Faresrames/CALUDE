"use client";
import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";

/** S06: lista das escolhidas para filtrar no Lightroom. */
export function ExportPanel({ id, names, favorites }: { id: string; names: string[]; favorites: string[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const text = names.join(", ");
  const favText = favorites.join(", ");
  async function copy(what: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(what);
    setTimeout(() => setCopied(null), 2000);
  }
  return (
    <section aria-labelledby="export-t" className="flex flex-col gap-3 rounded-lg border border-line bg-raised p-5 shadow-card">
      <h2 id="export-t" className="text-lg font-semibold text-ink">Lista para o Lightroom</h2>
      <p className="text-sm text-muted">
        No Lightroom Classic: Biblioteca → barra de filtro → <strong className="text-ink">Texto</strong> →
        <strong className="text-ink"> Nome do arquivo</strong> → <strong className="text-ink">Contém</strong>, e cole a lista.
      </p>
      {names.some((n) => n.includes(",")) && (
        <p role="note" className="rounded-md bg-surface p-3 text-sm text-warning">
          {names.filter((n) => n.includes(",")).length} {names.filter((n) => n.includes(",")).length === 1 ? "nome tem" : "nomes têm"} vírgula
          ({names.filter((n) => n.includes(",")).slice(0, 3).join("; ")}) e o filtro do Lightroom vai separar errado. Renomeie esses arquivos ou use o CSV.
        </p>
      )}
      <label className="sr-only" htmlFor="export-list">Nomes das fotos escolhidas</label>
      <textarea id="export-list" readOnly rows={3} value={text}
        className="resize-y rounded-md border border-line-input bg-surface p-3 font-mono text-sm text-ink" />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => copy("all", text)}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-hover">
          {copied === "all" ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
          {copied === "all" ? "Copiado" : `Copiar ${names.length} nomes`}
        </button>
        {favorites.length > 0 && (
          <button type="button" onClick={() => copy("fav", favText)}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-line-input bg-raised px-4 text-sm font-semibold text-ink hover:bg-surface">
            {copied === "fav" ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
            {copied === "fav" ? "Copiado" : `Copiar ${favorites.length === 1 ? "1 favorita" : `${favorites.length} favoritas`}`}
          </button>
        )}
        <a href={`/api/galleries/${id}/export?format=csv`}
          className="inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-ink hover:bg-surface">
          <Download aria-hidden className="size-4" /> Baixar CSV
        </a>
      </div>
    </section>
  );
}

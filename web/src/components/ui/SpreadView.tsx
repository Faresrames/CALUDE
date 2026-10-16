"use client";
import { clsx } from "clsx";
import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";

export type SpreadComment = { id: string; x: number | null; y: number | null; body: string; author: "client" | "photographer" };

/** Lâmina do álbum com os comentários marcados (pinos numerados). Editável: toca para marcar um ponto. */
export function SpreadView({ src, label, comments, editable, onAdd }: {
  src: string;
  label: string;
  comments: SpreadComment[];
  editable?: boolean;
  onAdd?: (x: number | null, y: number | null, body: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<{ x: number | null; y: number | null } | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const pinned = comments.filter((c) => c.x !== null);

  return (
    <figure className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-md border border-line bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} draggable={false} onContextMenu={(e) => e.preventDefault()} className="block w-full select-none" />
        {editable && (
          <button type="button" aria-label={`Marcar um ponto em ${label}`}
            className="absolute inset-0 cursor-crosshair"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              // teclado (Enter) não tem posição: marca o centro
              const x = e.detail === 0 ? 0.5 : (e.clientX - r.left) / r.width;
              const y = e.detail === 0 ? 0.5 : (e.clientY - r.top) / r.height;
              setDraft({ x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) });
            }} />
        )}
        {pinned.map((c) => (
          <span key={c.id} aria-hidden
            className="pointer-events-none absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill border-2 border-on-accent bg-accent text-xs font-semibold text-on-accent shadow-pop"
            style={{ left: `${c.x! * 100}%`, top: `${c.y! * 100}%` }}>
            {comments.indexOf(c) + 1}
          </span>
        ))}
        {draft?.x != null && (
          <span aria-hidden className="pointer-events-none absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-dashed border-accent bg-on-accent/70"
            style={{ left: `${draft.x * 100}%`, top: `${draft.y! * 100}%` }} />
        )}
      </div>
      <figcaption className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink">{label}</span>
        {comments.length > 0 && (
          <ol className="flex flex-col gap-1.5 text-sm">
            {comments.map((c, i) => (
              <li key={c.id} className="flex gap-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-pill bg-accent text-xs text-on-accent">{i + 1}</span>
                <span className="text-ink">{c.x === null ? <em className="not-italic text-muted">Na lâmina toda: </em> : null}{c.body}</span>
              </li>
            ))}
          </ol>
        )}
        {editable && !draft && (
          <button type="button" onClick={() => setDraft({ x: null, y: null })}
            className="inline-flex items-center gap-1.5 self-start text-sm text-muted underline hover:text-ink">
            <MessageSquarePlus aria-hidden className="size-4" /> Comentar a lâmina toda
          </button>
        )}
        {editable && draft && (
          <form className="flex flex-col gap-2 rounded-md bg-surface p-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!text.trim() || !onAdd) return;
              setBusy(true);
              const ok = await onAdd(draft.x, draft.y, text.trim());
              setBusy(false);
              if (ok) { setDraft(null); setText(""); }
            }}>
            <label className="text-sm font-medium text-ink" htmlFor={`c-${label}`}>
              {draft.x === null ? "Comentário sobre a lâmina toda" : "Comentário neste ponto"}
            </label>
            <textarea id={`c-${label}`} autoFocus rows={2} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Ex.: trocar esta foto pela do beijo na saída"
              className="resize-none rounded-md border border-line-input bg-raised px-3 py-2 text-sm text-ink placeholder:text-muted" />
            <div className="flex gap-2">
              <button type="submit" disabled={busy || !text.trim()}
                className={clsx("h-9 rounded-md bg-accent px-4 text-sm font-semibold text-on-accent disabled:opacity-50")}>Salvar comentário</button>
              <button type="button" onClick={() => { setDraft(null); setText(""); }} className="h-9 rounded-md px-3 text-sm text-ink hover:bg-raised">Cancelar</button>
            </div>
          </form>
        )}
      </figcaption>
    </figure>
  );
}

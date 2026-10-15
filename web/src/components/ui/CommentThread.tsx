"use client";
import { clsx } from "clsx";
import { useState } from "react";

export type Comment = { id: string; author: "client" | "photographer"; authorName: string; body: string; at: string };

export function CommentThread({ comments, onSend, dark, disabled }: {
  comments: Comment[];
  onSend?: (body: string) => void;
  dark?: boolean;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const muted = dark ? "text-on-lightbox-muted" : "text-muted";
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Comentários</h3>
      {comments.length === 0 ? (
        <p className={clsx("text-sm", muted)}>Nenhum comentário nesta foto ainda.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="text-sm">
              <p className={clsx("text-xs", muted)}>
                {c.authorName} · {c.at}
              </p>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
      )}
      {onSend && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) { onSend(draft.trim()); setDraft(""); }
          }}
        >
          <label className="sr-only" htmlFor="comment-box">Escrever comentário</label>
          <textarea
            id="comment-box"
            rows={2}
            maxLength={2000}
            disabled={disabled}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ex.: dá para clarear um pouco?"
            className={clsx(
              "resize-none rounded-md border px-3 py-2 text-sm",
              dark ? "border-on-lightbox-muted bg-transparent text-on-lightbox placeholder:text-on-lightbox-muted"
                   : "border-line-input bg-raised text-ink placeholder:text-muted",
            )}
          />
          <button type="submit" disabled={disabled || !draft.trim()}
            className={clsx("h-9 self-end rounded-md px-4 text-sm font-semibold disabled:opacity-50",
              dark ? "bg-on-lightbox text-lightbox" : "bg-accent text-on-accent")}>
            Enviar
          </button>
        </form>
      )}
    </div>
  );
}

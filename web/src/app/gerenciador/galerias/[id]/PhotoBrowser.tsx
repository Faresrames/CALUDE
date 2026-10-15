"use client";
import { clsx } from "clsx";
import { useMemo, useState } from "react";
import { CommentThread } from "@/components/ui/CommentThread";
import { Lightbox } from "@/components/ui/Lightbox";
import { PhotoTile } from "@/components/ui/PhotoTile";

export type BrowserPhoto = {
  id: string; name: string; thumb: string; preview: string; selected: boolean; favorited: boolean; pick: boolean;
  comments: { id: string; author: "client" | "photographer"; body: string; at: string }[];
};

type Filter = "all" | "selected" | "favorited" | "commented";

/** Fotos da galeria vistas pelo fotógrafo (só leitura). */
export function PhotoBrowser({ photos, clientName }: { photos: BrowserPhoto[]; clientName: string }) {
  const [filter, setFilter] = useState<Filter>(photos.some((p) => p.selected) ? "selected" : "all");
  const [open, setOpen] = useState<number | null>(null);
  const shown = useMemo(() => photos.filter((p) =>
    filter === "all" || (filter === "selected" && p.selected) || (filter === "favorited" && p.favorited) || (filter === "commented" && p.comments.length > 0),
  ), [photos, filter]);
  const counts = {
    all: photos.length,
    selected: photos.filter((p) => p.selected).length,
    favorited: photos.filter((p) => p.favorited).length,
    commented: photos.filter((p) => p.comments.length).length,
  };
  const labels: Record<Filter, string> = { all: "Todas", selected: "Escolhidas", favorited: "Favoritas", commented: "Com comentário" };
  const current = open === null ? null : shown[open];

  return (
    <section aria-labelledby="photos-t" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="photos-t" className="text-lg font-semibold text-ink">Fotos</h2>
        <div role="tablist" aria-label="Filtrar fotos" className="flex gap-1 overflow-x-auto">
          {(Object.keys(labels) as Filter[]).map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} type="button" onClick={() => setFilter(f)}
              className={clsx("whitespace-nowrap rounded-pill px-3 py-1.5 text-sm",
                filter === f ? "bg-accent text-on-accent" : "text-muted hover:bg-surface hover:text-ink")}>
              {labels[f]} ({counts[f]})
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="rounded-md bg-surface p-6 text-center text-sm text-muted">Nenhuma foto neste filtro.</p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
          {shown.map((p, i) => (
            <li key={p.id}>
              <PhotoTile src={p.thumb} name={p.name} selected={p.selected} favorited={p.favorited} comments={p.comments.length}
                photographerPick={p.pick} readOnly onOpen={() => setOpen(i)} />
            </li>
          ))}
        </ul>
      )}
      <Lightbox readOnly index={open} onIndexChange={setOpen}
        photos={shown.map((p) => ({ id: p.id, src: p.preview, name: p.name, selected: p.selected, favorited: p.favorited }))}
        aside={current && <CommentThread dark comments={current.comments.map((c) => ({
          ...c, authorName: c.author === "client" ? clientName : "Você",
        }))} />} />
    </section>
  );
}

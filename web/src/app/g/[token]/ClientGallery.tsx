"use client";
import { clsx } from "clsx";
import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CommentThread, type Comment as UiComment } from "@/components/ui/CommentThread";
import { Lightbox } from "@/components/ui/Lightbox";
import { PhotoTile } from "@/components/ui/PhotoTile";
import { SelectionCounter } from "@/components/ui/SelectionCounter";
import { useToast } from "@/components/ui/Toast";

export type ClientPhoto = {
  id: string; name: string; folder: string | null; thumb: string; preview: string; pick: boolean; selected: boolean; favorited: boolean;
};
export type ClientComment = { id: string; photoId: string | null; author: "client" | "photographer"; body: string; at: string };

type Props = {
  token: string;
  locked: null | "submitted" | "expired";
  packageSize: number;
  allowExtras: boolean;
  extraPriceCents: number;
  allowComments: boolean;
  clientName: string;
  photos: ClientPhoto[];
  comments: ClientComment[];
  initialCount: number;
};

type View = "all" | "selected" | "favorited";

export function ClientGallery(p: Props) {
  const toast = useToast();
  const [photos, setPhotos] = useState(p.photos);
  const [count, setCount] = useState(p.initialCount);
  const [comments, setComments] = useState(p.comments);
  const [view, setView] = useState<View>("all");
  const [folder, setFolder] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const readOnly = !!p.locked;

  const folders = useMemo(() => [...new Set(photos.map((x) => x.folder).filter((f): f is string => !!f))], [photos]);
  const shown = useMemo(() => photos.filter((x) =>
    (!folder || x.folder === folder) && (view === "all" || (view === "selected" ? x.selected : x.favorited))), [photos, folder, view]);
  const favCount = photos.filter((x) => x.favorited).length;

  async function toggle(id: string, key: "selected" | "favorited") {
    const before = photos.find((x) => x.id === id);
    if (!before || readOnly) return;
    const next = !before[key];
    setPhotos((xs) => xs.map((x) => (x.id === id ? { ...x, [key]: next } : x)));
    const res = await fetch(`/api/g/${p.token}/selections/${id}`, {
      method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ [key]: next }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    if (!res?.ok) {
      setPhotos((xs) => xs.map((x) => (x.id === id ? { ...x, [key]: before[key] } : x)));
      toast("error", json.message ?? "Sem conexão. A foto não foi salva; tente de novo.");
      return;
    }
    setCount(json.count);
  }

  async function sendComment(photoId: string, body: string) {
    const res = await fetch(`/api/g/${p.token}/comments`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ photoId, body }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    if (!res?.ok) return toast("error", json.message ?? "Comentário não enviado.");
    setComments((c) => [...c, { id: json.id, photoId, author: "client", body: json.body, at: "agora" }]);
  }

  const current = open === null ? null : shown[open];
  const currentComments: UiComment[] = current
    ? comments.filter((c) => c.photoId === current.id).map((c) => ({ id: c.id, author: c.author, body: c.body, at: c.at,
        authorName: c.author === "client" ? p.clientName : "Fotógrafo" }))
    : [];

  return (
    <>
      {p.locked && (
        <div role="status" className="mb-4 flex items-start gap-3 rounded-lg border border-line bg-raised p-4 text-sm">
          <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
          <p className="text-ink">
            {p.locked === "submitted"
              ? "Sua seleção já foi enviada. Você pode ver as fotos, mas para mudar alguma coisa fale com o fotógrafo."
              : "O prazo para escolher terminou. Fale com o fotógrafo para pedir mais tempo."}
          </p>
        </div>
      )}

      <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <SelectionCounter count={count} packageSize={p.packageSize} extraPriceCents={p.extraPriceCents} allowExtras={p.allowExtras} />
        {!readOnly && (
          <Link href={`/g/${p.token}/revisar`} aria-disabled={count === 0}
            className={clsx("inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover",
              count === 0 && "pointer-events-none opacity-50")}>
            Revisar e enviar <ArrowRight aria-hidden className="size-4" />
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3 py-4">
        {folders.length > 1 && (
          <div role="tablist" aria-label="Momentos" className="flex gap-1 overflow-x-auto">
            {[null, ...folders].map((f) => (
              <button key={f ?? "_all"} role="tab" type="button" aria-selected={folder === f} onClick={() => setFolder(f)}
                className={clsx("whitespace-nowrap rounded-pill px-3 py-1.5 text-sm",
                  folder === f ? "bg-accent text-on-accent" : "text-muted hover:bg-surface hover:text-ink")}>
                {f ?? "Todos os momentos"}
              </button>
            ))}
          </div>
        )}
        <div role="tablist" aria-label="Mostrar" className="flex gap-1 overflow-x-auto">
          {([["all", `Todas (${photos.length})`], ["selected", `Escolhidas (${count})`], ["favorited", `Favoritas (${favCount})`]] as [View, string][]).map(([v, label]) => (
            <button key={v} role="tab" type="button" aria-selected={view === v} onClick={() => setView(v)}
              className={clsx("whitespace-nowrap rounded-pill border px-3 py-1.5 text-sm",
                view === v ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-md bg-surface p-8 text-center text-sm text-muted">
          {view === "selected" ? "Você ainda não escolheu nenhuma foto. Toque no círculo de uma foto para escolher." :
           view === "favorited" ? "Nenhuma favorita ainda. O coração guarda as que você mais gostou." : "Nenhuma foto aqui."}
        </p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2 pb-16 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
          {shown.map((x, i) => (
            <li key={x.id}>
              <PhotoTile src={x.thumb} name={x.name} selected={x.selected} favorited={x.favorited} photographerPick={x.pick}
                comments={comments.filter((c) => c.photoId === x.id).length} readOnly={readOnly}
                onOpen={() => setOpen(i)} onToggleSelect={() => toggle(x.id, "selected")} onToggleFavorite={() => toggle(x.id, "favorited")} />
            </li>
          ))}
        </ul>
      )}

      <Lightbox index={open} onIndexChange={setOpen} readOnly={readOnly}
        photos={shown.map((x) => ({ id: x.id, src: x.preview, name: x.name, selected: x.selected, favorited: x.favorited }))}
        onToggleSelect={(id) => toggle(id, "selected")} onToggleFavorite={(id) => toggle(id, "favorited")}
        aside={p.allowComments && current ? (
          <CommentThread dark comments={currentComments} disabled={readOnly}
            onSend={readOnly ? undefined : (body) => sendComment(current.id, body)} />
        ) : undefined} />
    </>
  );
}

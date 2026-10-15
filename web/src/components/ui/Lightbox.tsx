"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { clsx } from "clsx";
import { Check, ChevronLeft, ChevronRight, Heart, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export type LightboxPhoto = { id: string; src: string; name: string; selected?: boolean; favorited?: boolean };

export type LightboxProps = {
  photos: LightboxPhoto[];
  index: number | null;
  onIndexChange: (i: number | null) => void;
  onToggleSelect?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  /** painel lateral (comentários) */
  aside?: ReactNode;
  readOnly?: boolean;
};

export function Lightbox({ photos, index, onIndexChange, onToggleSelect, onToggleFavorite, aside, readOnly }: LightboxProps) {
  const photo = index === null ? null : photos[index];
  const prev = () => index !== null && index > 0 && onIndexChange(index - 1);
  const next = () => index !== null && index < photos.length - 1 && onIndexChange(index + 1);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (!readOnly && photo && (e.key === " " || e.key === "s")) {
        e.preventDefault();
        onToggleSelect?.(photo.id);
      }
      if (!readOnly && photo && e.key === "f") onToggleFavorite?.(photo.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <Dialog.Root open={index !== null} onOpenChange={(o) => !o && onIndexChange(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-lightbox" />
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col text-on-lightbox lg:flex-row" aria-describedby={undefined}>
          <div className="relative flex min-h-0 flex-1 flex-col">
            <header className="flex h-14 items-center justify-between gap-2 px-3">
              <Dialog.Title className="truncate text-sm text-on-lightbox-muted">
                {photo?.name} · {index !== null ? index + 1 : 0} de {photos.length}
              </Dialog.Title>
              <Dialog.Close aria-label="Fechar" className="grid size-10 place-items-center rounded-pill hover:bg-on-lightbox/10">
                <X aria-hidden className="size-5" />
              </Dialog.Close>
            </header>
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-12">
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.src}
                  alt={photo.name}
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  className="max-h-full max-w-full select-none object-contain"
                />
              )}
              <button type="button" onClick={prev} disabled={index === 0} aria-label="Foto anterior"
                className="absolute left-1 grid size-10 place-items-center rounded-pill hover:bg-on-lightbox/10 disabled:opacity-30">
                <ChevronLeft aria-hidden className="size-6" />
              </button>
              <button type="button" onClick={next} disabled={index === photos.length - 1} aria-label="Próxima foto"
                className="absolute right-1 grid size-10 place-items-center rounded-pill hover:bg-on-lightbox/10 disabled:opacity-30">
                <ChevronRight aria-hidden className="size-6" />
              </button>
            </div>
            {!readOnly && photo && (
              <footer className="flex items-center justify-center gap-3 p-4">
                <button type="button" onClick={() => onToggleFavorite?.(photo.id)} aria-pressed={!!photo.favorited}
                  className="inline-flex h-11 items-center gap-2 rounded-pill border border-on-lightbox-muted px-4 text-sm">
                  <Heart aria-hidden className={clsx("size-4", photo.favorited && "fill-favorite-dark text-favorite-dark")} />
                  {photo.favorited ? "Favorita" : "Favoritar"}
                </button>
                <button type="button" onClick={() => onToggleSelect?.(photo.id)} aria-pressed={!!photo.selected}
                  className={clsx("inline-flex h-11 items-center gap-2 rounded-pill px-5 text-sm font-semibold",
                    photo.selected ? "bg-selected text-on-selected" : "bg-on-lightbox text-lightbox")}>
                  <Check aria-hidden className="size-4" />
                  {photo.selected ? "Selecionada" : "Selecionar"}
                </button>
              </footer>
            )}
          </div>
          {aside && <aside className="max-h-[40vh] overflow-auto border-t border-on-lightbox/15 p-4 lg:max-h-none lg:w-80 lg:border-l lg:border-t-0">{aside}</aside>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

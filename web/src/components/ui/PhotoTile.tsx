"use client";
import { clsx } from "clsx";
import { Check, Heart, ImageOff, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type PhotoTileProps = {
  src?: string;
  name: string;
  selected?: boolean;
  favorited?: boolean;
  comments?: number;
  photographerPick?: boolean;
  /** abre a foto grande */
  onOpen?: () => void;
  onToggleSelect?: () => void;
  onToggleFavorite?: () => void;
  /** galeria travada: mostra o estado, sem botões */
  readOnly?: boolean;
};

export function PhotoTile({
  src, name, selected, favorited, comments = 0, photographerPick, onOpen, onToggleSelect, onToggleFavorite, readOnly,
}: PhotoTileProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  // A imagem pode terminar de carregar (ou falhar) antes da hidratação, e aí
  // onLoad/onError nunca disparam no React. Confere o estado ao montar.
  useEffect(() => {
    const el = img.current;
    if (el?.complete) (el.naturalWidth > 0 ? setLoaded : setFailed)(true);
  }, [src]);
  return (
    <div
      className={clsx(
        "group relative aspect-square overflow-hidden rounded-sm bg-surface",
        selected && "ring-3 ring-selected ring-offset-2 ring-offset-bg",
      )}
    >
      <button type="button" onClick={onOpen} className="block size-full" aria-label={`Abrir ${name}`}>
        {src && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={img}
            src={src}
            alt=""
            loading="lazy"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={clsx("size-full object-cover transition-opacity duration-200", loaded ? "opacity-100" : "opacity-0")}
          />
        ) : null}
        {!loaded && !failed && <span aria-hidden className="absolute inset-0 animate-pulse bg-surface" />}
        {failed && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs text-muted">
            <ImageOff aria-hidden className="size-5" />
            Não carregou
          </span>
        )}
      </button>

      {photographerPick && (
        <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-pill bg-raised/90 px-2 py-0.5 text-xs text-ink">
          Sugestão
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-lightbox/70 to-transparent p-1.5">
        <span className="flex items-center gap-1 text-xs text-on-lightbox">
          {comments > 0 && (
            <>
              <MessageCircle aria-hidden className="size-3.5" />
              <span aria-label={`${comments} comentários`}>{comments}</span>
            </>
          )}
        </span>
        <span className="flex gap-1">
          {readOnly ? (
            <>
              {favorited && <Heart aria-label="Favorita" className="size-5 fill-favorite-dark text-favorite-dark" />}
              {selected && <Check aria-label="Selecionada" className="size-5 rounded-pill bg-selected p-0.5 text-on-selected" />}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onToggleFavorite}
                aria-pressed={!!favorited}
                aria-label={favorited ? `Tirar ${name} das favoritas` : `Favoritar ${name}`}
                className="grid size-8 place-items-center rounded-pill bg-lightbox/40 text-on-lightbox hover:bg-lightbox/60"
              >
                <Heart aria-hidden className={clsx("size-4", favorited && "fill-favorite-dark text-favorite-dark")} />
              </button>
              <button
                type="button"
                onClick={onToggleSelect}
                aria-pressed={!!selected}
                aria-label={selected ? `Desmarcar ${name}` : `Selecionar ${name}`}
                className={clsx(
                  "grid size-8 place-items-center rounded-pill border-2",
                  selected ? "border-selected bg-selected text-on-selected" : "border-on-lightbox bg-lightbox/40 text-on-lightbox",
                )}
              >
                <Check aria-hidden className={clsx("size-4", !selected && "opacity-0 group-hover:opacity-70")} />
              </button>
            </>
          )}
        </span>
      </div>
    </div>
  );
}

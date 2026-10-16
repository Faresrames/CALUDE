import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AlbumStatusBadge } from "@/components/ui/AlbumStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requirePhotographer } from "@/lib/auth";
import { data } from "@/lib/data";
import { NewAlbumForm } from "./NewAlbumForm";

export const metadata: Metadata = { title: "Álbuns" };

/** S09: álbuns para aprovação. */
export default async function AlbunsPage() {
  const p = await requirePhotographer();
  const [albums, galleries] = await Promise.all([data.listAlbums(p.id), data.listGalleries(p.id)]);
  const withAlbum = new Set(albums.map((a) => a.galleryId));
  const free = galleries.filter((g) => !withAlbum.has(g.id) && g.status !== "draft")
    .map((g) => ({ id: g.id, label: `${g.title}${g.clientName ? ` · ${g.clientName}` : ""}` }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-xl text-ink">Álbuns</h1>
        <p className="text-sm text-muted">Mande a diagramação, o cliente comenta em cada página e aprova.</p>
      </header>
      {free.length > 0 ? <NewAlbumForm galleries={free} /> : (
        <p className="text-sm text-muted">Para criar um álbum, libere uma galeria para o cliente primeiro.</p>
      )}
      {albums.length === 0 ? (
        <EmptyState icon={<BookOpen className="size-8" />} title="Nenhum álbum ainda"
          body="Crie um álbum a partir de uma galeria e suba as lâminas da diagramação." />
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-raised">
          {albums.map((a) => (
            <li key={a.id}>
              <Link href={`/gerenciador/albuns/${a.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-surface">
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">{a.title}</span>
                  <span className="block truncate text-sm text-muted">{a.galleryTitle}{a.clientName ? ` · ${a.clientName}` : ""}{a.latest ? ` · versão ${a.latest.number}` : ""}</span>
                </span>
                <AlbumStatusBadge status={a.latest?.status ?? null} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

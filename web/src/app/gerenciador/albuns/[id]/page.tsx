import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumStatusBadge } from "@/components/ui/AlbumStatusBadge";
import { SpreadView } from "@/components/ui/SpreadView";
import { requirePhotographer } from "@/lib/auth";
import { data } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { viewUrls } from "@/lib/storage";
import { SpreadUploader } from "./SpreadUploader";

export const metadata: Metadata = { title: "Álbum" };

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await requirePhotographer();
  const album = await data.getAlbum(p.id, (await params).id);
  if (!album) notFound();
  const g = await data.getGallery(p.id, album.galleryId);
  const urls = await viewUrls(album.versions.flatMap((v) => v.spreads.map((s) => s.imageKey)));
  let u = 0;
  const latest = album.versions[0] ?? null;

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Caminho" className="text-sm text-muted">
        <Link href="/gerenciador/albuns" className="hover:text-ink hover:underline">Álbuns</Link> / {album.title}
      </nav>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl text-ink">{album.title}</h1>
          <p className="text-sm text-muted">
            <Link href={`/gerenciador/galerias/${album.galleryId}`} className="underline hover:text-ink">{g?.title}</Link>
            {g?.clientName ? ` · ${g.clientName}` : ""}
          </p>
        </div>
        <AlbumStatusBadge status={latest?.status ?? null} />
      </header>

      {latest?.status === "approved" ? (
        <p role="status" className="rounded-lg border border-success bg-raised p-4 text-sm text-ink">
          Versão {latest.number} aprovada em {formatDate(latest.decidedAt, true)}. Pode mandar para a gráfica.
        </p>
      ) : (
        <SpreadUploader albumId={album.id} nextNumber={(latest?.number ?? 0) + 1} />
      )}
      {latest?.status === "pending" && (
        <p className="text-sm text-muted">
          A versão {latest.number} está com o cliente. Publicar uma nova substitui a que ele vê.
          {g && <> Link do cliente: <span className="break-all">/g/{g.accessToken}/album</span></>}
        </p>
      )}

      {album.versions.map((v) => (
        <section key={v.id} aria-labelledby={`v-${v.number}`} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id={`v-${v.number}`} className="text-lg font-semibold text-ink">Versão {v.number}</h2>
            <AlbumStatusBadge status={v.status} />
            <span className="text-sm text-muted">{formatDate(v.createdAt, true)}{v.decidedAt ? ` · decidida em ${formatDate(v.decidedAt, true)}` : ""}</span>
          </div>
          {v.note && <p className="text-sm text-muted">Seu recado: {v.note}</p>}
          <ul className="grid gap-6 md:grid-cols-2">
            {v.spreads.map((s) => (
              <li key={s.id}>
                <SpreadView src={urls[u++]} label={`Lâmina ${s.position}`} comments={s.comments} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

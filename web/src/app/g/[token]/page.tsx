import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isGalleryUnlocked } from "@/lib/auth";
import { data } from "@/lib/data";
import { formatBRL, formatDate, formatDeadline } from "@/lib/format";
import { viewUrls } from "@/lib/storage";
import { ClientGallery } from "./ClientGallery";
import { UnlockForm } from "./UnlockForm";

export const metadata: Metadata = { title: "Escolha suas fotos", robots: { index: false, follow: false } };

export default async function ClientGalleryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const g = await data.getGalleryByToken(token);
  if (!g || g.status === "draft" || g.status === "archived") notFound();
  const studio = await data.getPhotographer(g.photographerId);
  const studioName = studio?.businessName ?? studio?.name ?? "";
  if (!(await isGalleryUnlocked(g.id, !!g.passwordHash))) return <UnlockForm token={token} title={g.title} studio={studioName} />;

  await data.markOpened(g.id);
  const [photos, selections, comments, album] = await Promise.all([
    data.listPhotos(g.id), data.listSelections(g.id), data.listComments(g.id), data.getAlbumForGallery(g.id),
  ]);
  const sel = new Map(selections.map((s) => [s.photoId, s]));
  const [thumbs, previews] = await Promise.all([viewUrls(photos.map((p) => p.thumbKey)), viewUrls(photos.map((p) => p.previewKey))]);
  const locked = g.status === "submitted" || g.status === "delivered" ? "submitted" : g.status === "expired" ? "expired" : null;

  return (
    <main className="mx-auto max-w-content px-4 pt-8">
      <header className="flex flex-col gap-2 pb-4">
        <p className="text-sm text-muted">{studioName}</p>
        <h1 className="break-words font-display text-xl text-ink sm:text-display">{g.title}</h1>
        <p className="text-sm text-muted">
          Escolha {g.packageSize} fotos para o seu pacote
          {g.allowExtras && g.extraPriceCents > 0 ? `; cada foto a mais custa ${formatBRL(g.extraPriceCents)}` : ""}.
          {g.deadlineAt && !locked ? ` Prazo: ${formatDeadline(g.deadlineAt)}.` : ""}
        </p>
        <p className="text-sm text-muted">Toque no círculo para escolher, no coração para favoritar. Tudo é salvo na hora.</p>
        {album?.versions.length ? (
          <Link href={`/g/${token}/album`} className="self-start text-sm font-semibold text-ink underline">
            {album.versions[0].status === "pending" ? "Seu álbum está pronto para revisar →" : "Ver o álbum →"}
          </Link>
        ) : null}
      </header>
      <ClientGallery token={token} locked={locked} packageSize={g.packageSize} allowExtras={g.allowExtras}
        extraPriceCents={g.extraPriceCents} allowComments={g.allowComments} clientName={g.clientName ?? "Você"}
        initialCount={g.selectedCount}
        photos={photos.map((p, i) => ({
          id: p.id, name: p.basename, folder: p.folder, thumb: thumbs[i], preview: previews[i],
          pick: p.photographerPick, selected: !!sel.get(p.id)?.selected, favorited: !!sel.get(p.id)?.favorited,
        }))}
        comments={comments.map((c) => ({ id: c.id, photoId: c.photoId, author: c.author, body: c.body, at: formatDate(c.createdAt, true) }))} />
    </main>
  );
}

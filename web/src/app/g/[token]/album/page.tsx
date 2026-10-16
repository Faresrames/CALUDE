import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { clientGallery } from "@/lib/api";
import { data } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { viewUrls } from "@/lib/storage";
import { AlbumReview } from "./AlbumReview";

export const metadata: Metadata = { title: "Revisar o álbum", robots: { index: false } };

/** S17: o cliente revisa a versão mais nova do álbum. */
export default async function AlbumClientPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const g = await clientGallery(token);
  if (!g) notFound();
  const [album, p] = await Promise.all([data.getAlbumForGallery(g.id), data.getPhotographer(g.photographerId)]);
  const v = album?.versions[0];
  const studio = p?.businessName ?? p?.name ?? "";

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 pt-8">
      <Link href={`/g/${token}`} className="text-sm text-muted hover:text-ink hover:underline">← Voltar para as fotos</Link>
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted">{studio}</p>
        <h1 className="font-display text-xl text-ink">{album?.title ?? "Álbum"}{v ? ` · versão ${v.number}` : ""}</h1>
      </header>
      {!v ? (
        <p className="rounded-lg border border-line bg-raised p-5 text-muted">O álbum ainda não está pronto. Você recebe um e-mail quando a diagramação chegar.</p>
      ) : (
        <>
          {v.status === "approved" && (
            <p role="status" className="rounded-lg border border-success bg-raised p-4 text-sm text-ink">Você aprovou esta versão em {formatDate(v.decidedAt, true)}. Agora é com o fotógrafo.</p>
          )}
          {v.status === "changes_requested" && (
            <p role="status" className="rounded-lg border border-warning bg-raised p-4 text-sm text-ink">Você pediu ajustes em {formatDate(v.decidedAt, true)}. A próxima versão chega por e-mail.</p>
          )}
          {v.status === "pending" && (
            <p className="text-sm text-muted">
              Toque em qualquer ponto de uma página para comentar ali, ou comente a página toda. Quando estiver tudo certo, aprove.
              {v.note ? ` Recado do fotógrafo: ${v.note}` : ""}
            </p>
          )}
          <AlbumReview token={token} versionId={v.id} number={v.number} locked={v.status !== "pending"}
            spreads={await (async () => {
              const urls = await viewUrls(v.spreads.map((s) => s.imageKey));
              return v.spreads.map((s, i) => ({ id: s.id, position: s.position, src: urls[i], comments: s.comments }));
            })()} />
        </>
      )}
    </main>
  );
}

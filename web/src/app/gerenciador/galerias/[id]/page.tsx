import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requirePhotographer } from "@/lib/auth";
import { data } from "@/lib/data";
import { dateInputValue, formatBRL, formatDate } from "@/lib/format";
import { viewUrls } from "@/lib/storage";
import { ExportPanel } from "./ExportPanel";
import { GalleryActions } from "./GalleryActions";
import { OrderPanel } from "./OrderPanel";
import { PhotoBrowser } from "./PhotoBrowser";

export const metadata: Metadata = { title: "Galeria" };

export default async function GaleriaPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await requirePhotographer();
  const g = await data.getGallery(p.id, (await params).id);
  if (!g) notFound();
  const [photos, selections, comments, exported, order] = await Promise.all([
    data.listPhotos(g.id), data.listSelections(g.id), data.listComments(g.id), data.exportSelection(p.id, g.id), data.getOrderForGallery(g.id),
  ]);
  const sel = new Map(selections.map((s) => [s.photoId, s]));
  const [thumbs, previews] = await Promise.all([viewUrls(photos.map((p) => p.thumbKey)), viewUrls(photos.map((p) => p.previewKey))]);
  const extras = Math.max(0, g.selectedCount - g.packageSize);
  const stats = [
    { label: "Fotos", value: String(g.photoCount) },
    { label: "Escolhidas", value: `${g.selectedCount} de ${g.packageSize}` },
    { label: "Extras", value: extras ? `${extras} · ${formatBRL(extras * g.extraPriceCents)}` : "0" },
    { label: "Prazo", value: g.deadlineAt ? formatDate(g.deadlineAt, true) : "Sem prazo" },
  ];
  const timeline = [
    g.sentAt && `Liberada em ${formatDate(g.sentAt, true)}`,
    g.firstOpenedAt ? `Cliente abriu em ${formatDate(g.firstOpenedAt, true)}` : g.sentAt ? "Cliente ainda não abriu" : null,
    g.submittedAt && `Seleção enviada em ${formatDate(g.submittedAt, true)}`,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Caminho" className="text-sm text-muted">
        <Link href="/gerenciador" className="hover:text-ink hover:underline">Galerias</Link> / <span className="break-words">{g.title}</span>
      </nav>

      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="break-words font-display text-xl text-ink">{g.title}</h1>
            <p className="text-sm text-muted">{g.clientName ?? "Sem cliente"}{g.eventDate ? ` · ${formatDate(g.eventDate)}` : ""}</p>
          </div>
          <StatusBadge status={g.status} />
        </div>
        <GalleryActions id={g.id} token={g.accessToken} status={g.status} photoCount={g.photoCount}
          minDate={dateInputValue(new Date().toISOString())} />
      </header>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-line bg-raised p-4">
            <dt className="text-xs font-medium text-muted">{s.label}</dt>
            <dd className="mt-1 text-lg font-semibold text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>
      {timeline.length > 0 && <p className="text-sm text-muted">{timeline.join(" · ")}</p>}

      {order && <OrderPanel id={order.id} extras={order.extrasCount} amountCents={order.amountCents} status={order.status} hasPixKey={!!p.pixKey} />}

      {exported.basenames.length > 0 && <ExportPanel id={g.id} names={exported.basenames} favorites={exported.favorites} />}

      {photos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-input bg-raised p-10 text-center">
          <p className="font-display text-lg text-ink">Nenhuma foto ainda</p>
          <p className="mt-1 text-sm text-muted">Suba as fotos do evento para liberar a galeria.</p>
          <Link href={`/gerenciador/galerias/${g.id}/enviar`} className="mt-4 inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-semibold text-on-accent">Subir fotos</Link>
        </div>
      ) : (
        <PhotoBrowser clientName={g.clientName ?? "Cliente"} photos={photos.map((ph, i) => ({
          id: ph.id, name: ph.basename, thumb: thumbs[i], preview: previews[i],
          selected: !!sel.get(ph.id)?.selected, favorited: !!sel.get(ph.id)?.favorited, pick: ph.photographerPick,
          comments: comments.filter((c) => c.photoId === ph.id).map((c) => ({ id: c.id, author: c.author, body: c.body, at: formatDate(c.createdAt, true) })),
        }))} />
      )}
    </div>
  );
}

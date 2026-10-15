import { CalendarClock, Images } from "lucide-react";
import Link from "next/link";
import { StatusBadge, type GalleryStatus } from "./StatusBadge";

export type GalleryCardProps = {
  href: string;
  title: string;
  client: string;
  eventDate: string;
  cover?: string;
  status: GalleryStatus;
  photos: number;
  selected: number;
  packageSize: number;
  deadline?: string;
};

export function GalleryCard(p: GalleryCardProps) {
  return (
    <Link href={p.href} className="group flex flex-col overflow-hidden rounded-lg border border-line bg-raised shadow-card transition-shadow hover:shadow-pop">
      <div className="relative aspect-[3/2] overflow-hidden bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.cover && <img src={p.cover} alt="" className="absolute inset-0 size-full object-cover" />}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-ink">{p.title}</h2>
            <p className="truncate text-sm text-muted">{p.client} · {p.eventDate}</p>
          </div>
          <StatusBadge status={p.status} />
        </div>
        <div className="flex items-center gap-4 text-sm text-muted">
          <span className="inline-flex items-center gap-1"><Images aria-hidden className="size-4" />{p.photos} fotos</span>
          <span className="text-ink">{p.selected}/{p.packageSize} escolhidas</span>
        </div>
        {p.deadline && (
          <p className="inline-flex items-center gap-1 text-xs text-muted">
            <CalendarClock aria-hidden className="size-3.5" />Prazo: {p.deadline}
          </p>
        )}
      </div>
    </Link>
  );
}

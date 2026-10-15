import { FolderOpen, Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { GalleryCard } from "@/components/ui/GalleryCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { GalleryStatus } from "@/components/ui/StatusBadge";
import { requirePhotographer } from "@/lib/auth";
import { data } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { storage } from "@/lib/storage";

export const metadata: Metadata = { title: "Galerias" };

const filters: { value: GalleryStatus | ""; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "in_progress", label: "Escolhendo" },
  { value: "submitted", label: "Seleção recebida" },
  { value: "sent", label: "Aguardando cliente" },
  { value: "expired", label: "Prazo vencido" },
  { value: "draft", label: "Rascunhos" },
];

export default async function GerenciadorPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const p = await requirePhotographer();
  const { q = "", status = "" } = await searchParams;
  const valid = filters.some((f) => f.value === status) ? (status as GalleryStatus | "") : "";
  const galleries = await data.listGalleries(p.id, { q, status: valid || undefined });
  const filtering = !!q || !!valid;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl text-ink">Galerias</h1>
          <p className="text-sm text-muted">Acompanhe cada seleção e baixe a lista quando o cliente terminar.</p>
        </div>
        <Link href="/gerenciador/galerias/nova"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-hover">
          <Plus aria-hidden className="size-4" /> Nova galeria
        </Link>
      </header>

      <form className="flex flex-col gap-3 sm:flex-row sm:items-center" role="search">
        <label className="relative flex-1 sm:max-w-xs">
          <span className="sr-only">Buscar por galeria ou cliente</span>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} placeholder="Buscar galeria ou cliente"
            className="h-10 w-full rounded-md border border-line-input bg-raised pl-9 pr-3 text-sm text-ink placeholder:text-muted" />
        </label>
        {valid && <input type="hidden" name="status" value={valid} />}
        <nav aria-label="Filtrar por status" className="flex gap-1 overflow-x-auto">
          {filters.map((f) => {
            const href = `/gerenciador?${new URLSearchParams({ ...(q ? { q } : {}), ...(f.value ? { status: f.value } : {}) })}`;
            const on = f.value === valid;
            return (
              <Link key={f.value} href={href} aria-current={on ? "page" : undefined}
                className={on ? "whitespace-nowrap rounded-pill bg-accent px-3 py-1.5 text-sm text-on-accent"
                              : "whitespace-nowrap rounded-pill px-3 py-1.5 text-sm text-muted hover:bg-surface hover:text-ink"}>
                {f.label}
              </Link>
            );
          })}
        </nav>
      </form>

      {galleries.length === 0 ? (
        filtering ? (
          <EmptyState icon={<Search className="size-8" />} title="Nada encontrado"
            body="Nenhuma galeria com esse filtro. Tente outro nome ou veja todas."
            action={<Link href="/gerenciador" className="text-sm font-semibold text-ink underline">Ver todas</Link>} />
        ) : (
          <EmptyState icon={<FolderOpen className="size-8" />} title="Nenhuma galeria ainda"
            body="Crie a primeira, suba as fotos do evento e mande o link para o cliente escolher."
            action={<Link href="/gerenciador/galerias/nova" className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-semibold text-on-accent">Nova galeria</Link>} />
        )
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {galleries.map((g) => (
            <li key={g.id} className="min-w-0">
              <GalleryCard href={`/gerenciador/galerias/${g.id}`} title={g.title} client={g.clientName ?? "Sem cliente"}
                eventDate={formatDate(g.eventDate)} cover={g.coverKey ? storage.viewUrl(g.coverKey) : undefined}
                status={g.status} photos={g.photoCount} selected={g.selectedCount} packageSize={g.packageSize}
                deadline={g.deadlineAt ? formatDate(g.deadlineAt, true) : undefined} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

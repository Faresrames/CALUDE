import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PhotoTile } from "@/components/ui/PhotoTile";
import { clientGallery } from "@/lib/api";
import { data } from "@/lib/data";
import { formatBRL } from "@/lib/format";
import { viewUrls } from "@/lib/storage";
import { SubmitButton } from "./SubmitButton";

export const metadata: Metadata = { title: "Revisar seleção", robots: { index: false } };

/** S14: conferir antes de enviar. */
export default async function RevisarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const g = await clientGallery(token);
  if (!g) notFound();
  if (g.status !== "sent" && g.status !== "in_progress") redirect(`/g/${token}`);
  const [photos, selections] = await Promise.all([data.listPhotos(g.id), data.listSelections(g.id)]);
  const chosen = new Set(selections.filter((s) => s.selected).map((s) => s.photoId));
  const fav = new Set(selections.filter((s) => s.favorited).map((s) => s.photoId));
  const list = photos.filter((p) => chosen.has(p.id));
  const thumbs = await viewUrls(list.map((p) => p.thumbKey));
  const extras = Math.max(0, list.length - g.packageSize);
  const missing = Math.max(0, g.packageSize - list.length);

  return (
    <main className="mx-auto flex max-w-content flex-col gap-6 px-4 py-8">
      <Link href={`/g/${token}`} className="text-sm text-muted hover:text-ink hover:underline">← Voltar para as fotos</Link>
      <h1 className="font-display text-xl text-ink">Confira sua seleção</h1>

      <section className="flex flex-col gap-3 rounded-lg border border-line bg-raised p-5 shadow-card">
        <dl className="grid gap-2 text-sm sm:grid-cols-3">
          <div><dt className="text-muted">Escolhidas</dt><dd className="text-lg font-semibold text-ink">{list.length}</dd></div>
          <div><dt className="text-muted">No pacote</dt><dd className="text-lg font-semibold text-ink">{Math.min(list.length, g.packageSize)} de {g.packageSize}</dd></div>
          <div><dt className="text-muted">Extras</dt><dd className="text-lg font-semibold text-ink">{extras ? `${extras} · ${formatBRL(extras * g.extraPriceCents)}` : "Nenhuma"}</dd></div>
        </dl>
        {missing > 0 && (
          <p className="rounded-md bg-surface p-3 text-sm text-warning">
            Ainda dá para escolher mais {missing} {missing === 1 ? "foto" : "fotos"} sem custo. Depois de enviar, só o fotógrafo pode reabrir.
          </p>
        )}
        {extras > 0 && (
          <p className="text-sm text-muted">As {extras} fotos a mais serão cobradas por PIX direto para o fotógrafo.</p>
        )}
        {list.length === 0 ? (
          <p className="text-sm text-muted">Escolha pelo menos uma foto para enviar.</p>
        ) : (
          <SubmitButton token={token} label={`Enviar ${list.length} ${list.length === 1 ? "foto" : "fotos"}`} />
        )}
      </section>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
        {list.map((p, i) => (
          <li key={p.id}><PhotoTile src={thumbs[i]} name={p.basename} selected favorited={fav.has(p.id)} readOnly /></li>
        ))}
      </ul>
    </main>
  );
}

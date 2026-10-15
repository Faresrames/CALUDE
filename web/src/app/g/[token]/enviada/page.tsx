import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { clientGallery } from "@/lib/api";
import { formatBRL } from "@/lib/format";

export const metadata: Metadata = { title: "Seleção enviada", robots: { index: false } };

/** S16: confirmação. */
export default async function EnviadaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const g = await clientGallery(token);
  if (!g) notFound();
  if (g.status !== "submitted" && g.status !== "delivered") redirect(`/g/${token}`);
  const extras = Math.max(0, g.selectedCount - g.packageSize);
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <CheckCircle2 aria-hidden className="size-12 text-success" />
      <h1 className="font-display text-xl text-ink">Seleção enviada!</h1>
      <p className="text-muted">
        O fotógrafo recebeu as suas {g.selectedCount} fotos e já pode começar o tratamento.
      </p>
      {extras > 0 && (
        <p className="rounded-md bg-surface p-3 text-sm text-ink">
          {extras} {extras === 1 ? "foto extra" : "fotos extras"}: {formatBRL(extras * g.extraPriceCents)}.{" "}
          <Link href={`/g/${token}/pagamento`} className="font-semibold underline">Ver pagamento</Link>
        </p>
      )}
      <Link href={`/g/${token}`} className="text-sm text-muted underline hover:text-ink">Ver as fotos de novo</Link>
    </main>
  );
}

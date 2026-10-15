import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePhotographer } from "@/lib/auth";
import { data } from "@/lib/data";
import { Uploader } from "./Uploader";

export const metadata: Metadata = { title: "Subir fotos" };

export default async function EnviarPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await requirePhotographer();
  const g = await data.getGallery(p.id, (await params).id);
  if (!g) notFound();
  const watermark = g.watermarkOn ? (p.watermarkText ?? p.businessName ?? p.name) : null;
  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Caminho" className="text-sm text-muted">
        <Link href="/gerenciador" className="hover:text-ink hover:underline">Galerias</Link> /{" "}
        <Link href={`/gerenciador/galerias/${g.id}`} className="hover:text-ink hover:underline">{g.title}</Link> / Subir fotos
      </nav>
      <header>
        <h1 className="font-display text-xl text-ink">Subir fotos</h1>
        <p className="text-sm text-muted">
          {g.photoCount} na galeria. As fotos são reduzidas para 1600px{watermark ? ` com a marca “${watermark}”` : ""} antes de sair do seu computador.
          Os originais ficam com você. Nomes repetidos são pulados.
        </p>
      </header>
      <Uploader galleryId={g.id} watermark={watermark} startCount={g.photoCount} />
    </div>
  );
}

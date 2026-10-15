import type { Metadata } from "next";
import Link from "next/link";
import { dateInputValue } from "@/lib/format";
import { NewGalleryForm } from "./NewGalleryForm";

export const metadata: Metadata = { title: "Nova galeria" };

export default function NovaGaleriaPage() {
  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Caminho" className="text-sm text-muted">
        <Link href="/gerenciador" className="hover:text-ink hover:underline">Galerias</Link> / Nova
      </nav>
      <h1 className="font-display text-xl text-ink">Nova galeria</h1>
      <NewGalleryForm today={dateInputValue(new Date().toISOString())} />
    </div>
  );
}

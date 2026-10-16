import Link from "next/link";
import { BRAND } from "@/lib/brand";

/** Moldura das páginas legais: aviso de rascunho enquanto não houver revisão jurídica. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12 text-ink [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-7 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
      <Link href="/" className="text-sm text-muted hover:text-ink hover:underline">← {BRAND.name}</Link>
      <h1 className="font-display text-xl">{title}</h1>
      <p className="text-sm text-muted">Atualizada em {updated}.</p>
      {children}
    </main>
  );
}

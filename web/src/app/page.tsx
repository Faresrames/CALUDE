import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-content px-4 py-16">
      <h1 className="font-display text-display">Seleção de fotos</h1>
      <p className="mt-2 text-muted">App em construção.</p>
      <Link href="/design" className="mt-6 inline-block underline">
        Ver o sistema de design
      </Link>
    </main>
  );
}

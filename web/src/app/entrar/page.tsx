import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { currentPhotographer, startSession } from "@/lib/auth";
import { data } from "@/lib/data";
import { DEMO_EMAIL } from "@/lib/data/seed";

export const metadata: Metadata = { title: "Entrar" };

async function login(form: FormData) {
  "use server";
  const email = String(form.get("email") ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect("/entrar?erro=email");
  const name = String(form.get("name") ?? "").trim() || email.split("@")[0];
  const p = await data.findOrCreatePhotographer(email, name);
  await startSession(p.id);
  redirect("/gerenciador");
}

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  if (await currentPhotographer()) redirect("/gerenciador");
  const { erro } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-display text-ink">Entrar</h1>
        <p className="mt-2 text-muted">Seu painel de galerias e seleções.</p>
        <form action={login} className="mt-8 flex flex-col gap-4 rounded-lg border border-line bg-raised p-6 shadow-card">
          <Field label="E-mail" name="email" type="email" autoComplete="email" required defaultValue={DEMO_EMAIL}
            error={erro === "email" ? "Digite um e-mail válido." : undefined} />
          <Field label="Seu nome ou do estúdio" name="name" autoComplete="name" hint="Só usado se for a primeira vez." />
          <Button type="submit" size="lg">Entrar</Button>
        </form>
        <p className="mt-4 rounded-md bg-surface p-3 text-sm text-muted">
          Modo demonstração: não pede senha. O login de verdade (e-mail e Google) entra na etapa de backend.
        </p>
      </div>
    </main>
  );
}

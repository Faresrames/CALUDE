import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { rateLimited } from "@/lib/api";
import { currentPhotographer, demoSignIn } from "@/lib/auth";
import { supabaseServer } from "@/lib/auth/supabase";
import { BRAND } from "@/lib/brand";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Entrar" };

const validEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

async function magicLink(form: FormData) {
  "use server";
  const email = String(form.get("email") ?? "").trim();
  if (!validEmail(email)) redirect("/entrar?erro=email");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(`login:${ip}`, 5, 10 * 60_000)) redirect("/entrar?erro=muitas");
  const { error } = await (await supabaseServer()).auth.signInWithOtp({
    email, options: { emailRedirectTo: `${env.appUrl}/auth/callback`, shouldCreateUser: true },
  });
  redirect(error ? "/entrar?erro=envio" : "/entrar?enviado=1"); // sem o e-mail na URL
}

async function google() {
  "use server";
  const { data, error } = await (await supabaseServer()).auth.signInWithOAuth({
    provider: "google", options: { redirectTo: `${env.appUrl}/auth/callback` },
  });
  redirect(error || !data.url ? "/entrar?erro=google" : data.url);
}

async function demo(form: FormData) {
  "use server";
  const email = String(form.get("email") ?? "").trim();
  if (!validEmail(email)) redirect("/entrar?erro=email");
  await demoSignIn(email, String(form.get("name") ?? "").trim() || email.split("@")[0]);
  redirect("/gerenciador");
}

const errors: Record<string, string> = {
  email: "Digite um e-mail válido.",
  muitas: "Muitas tentativas. Espere alguns minutos.",
  envio: "Não conseguimos mandar o e-mail agora. Tente de novo.",
  link: "Esse link expirou ou já foi usado. Peça outro.",
  google: "Não deu para entrar com o Google agora.",
};

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ erro?: string; enviado?: string }> }) {
  if (await currentPhotographer()) redirect("/gerenciador");
  const { erro, enviado } = await searchParams;
  const error = erro ? errors[erro] ?? errors.envio : undefined;
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="text-sm font-semibold tracking-wide text-ink">{BRAND.name}</p>
        <h1 className="font-display text-display text-ink">Entrar</h1>
        <p className="mt-2 text-muted">Suas galerias e seleções, num lugar só.</p>
        {env.auth === "supabase" ? (
          enviado ? (
            <div role="status" className="mt-8 rounded-lg border border-line bg-raised p-6 shadow-card">
              <p className="font-semibold text-ink">Confira seu e-mail</p>
              <p className="mt-1 text-sm text-muted">Mandamos um link de acesso para o e-mail que você digitou. Ele vale por 1 hora.</p>
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-4 rounded-lg border border-line bg-raised p-6 shadow-card">
              <form action={google}>
                <Button type="submit" variant="secondary" size="lg" className="w-full">Entrar com Google</Button>
              </form>
              <p className="text-center text-xs text-muted">ou receba um link no e-mail</p>
              <form action={magicLink} className="flex flex-col gap-4">
                <Field label="E-mail" name="email" type="email" autoComplete="email" required error={error} />
                <Button type="submit" size="lg">Mandar link de acesso</Button>
              </form>
              <p className="text-xs text-muted">Sem senha para lembrar. Primeira vez? A conta é criada no primeiro acesso, com 14 dias grátis.
                Ao entrar, você concorda com os <a href="/termos" className="underline">termos de uso</a> e a <a href="/privacidade" className="underline">política de privacidade</a>.</p>
            </div>
          )
        ) : (
          <>
            <form action={demo} className="mt-8 flex flex-col gap-4 rounded-lg border border-line bg-raised p-6 shadow-card">
              <Field label="E-mail" name="email" type="email" autoComplete="email" required defaultValue="demo@exemplo.com" error={error} />
              <Field label="Seu nome ou do estúdio" name="name" autoComplete="name" hint="Só usado se for a primeira vez." />
              <Button type="submit" size="lg">Entrar</Button>
            </form>
            <p className="mt-4 rounded-md bg-surface p-3 text-sm text-muted">
              Modo demonstração (Supabase não configurado): entra sem senha. Em produção o login é por link no e-mail ou Google.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

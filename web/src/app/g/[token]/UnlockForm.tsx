"use client";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

/** S11: senha da galeria. */
export function UnlockForm({ token, title, studio }: { token: string; title: string; studio: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <form className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-line bg-raised p-6 shadow-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(undefined);
          const password = new FormData(e.currentTarget).get("password");
          const res = await fetch(`/api/g/${token}/unlock`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
          setBusy(false);
          if (res.ok) router.refresh();
          else setError(((await res.json().catch(() => ({}))) as { message?: string }).message ?? "Não deu certo. Tente de novo.");
        }}>
        <Lock aria-hidden className="size-6 text-muted" />
        <div>
          <p className="text-sm text-muted">{studio}</p>
          <h1 className="break-words font-display text-xl text-ink">{title}</h1>
        </div>
        <Field label="Senha da galeria" name="password" type="password" autoComplete="current-password" autoFocus required error={error}
          hint="Está na mensagem em que você recebeu o link." />
        <Button type="submit" size="lg" loading={busy}>Ver as fotos</Button>
      </form>
    </main>
  );
}

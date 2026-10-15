"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function SubmitButton({ token, label }: { token: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" loading={busy} onClick={async () => {
        setBusy(true);
        setError(undefined);
        const res = await fetch(`/api/g/${token}/submit`, { method: "POST" }).catch(() => null);
        if (res?.ok) return router.push(`/g/${token}/enviada`);
        setBusy(false);
        setError(((await res?.json().catch(() => ({}))) as { message?: string } | undefined)?.message ?? "Sem conexão. Tente de novo.");
      }}>{label}</Button>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}

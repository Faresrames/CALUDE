"use client";
import { Copy, ExternalLink, Send, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { GalleryStatus } from "@/lib/data/types";

export function GalleryActions({ id, token, status, photoCount, minDate }: {
  id: string; token: string; status: GalleryStatus; photoCount: number; minDate: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [deadline, setDeadline] = useState("");

  async function post(path: string, body?: unknown) {
    const res = await fetch(`/api/galleries/${id}/${path}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message ?? "Erro");
  }

  async function run(name: string, fn: () => Promise<void>, ok: string) {
    setBusy(name);
    try { await fn(); toast("success", ok); router.refresh(); }
    catch (e) { toast("error", (e as Error).message); }
    finally { setBusy(null); }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Link href={`/gerenciador/galerias/${id}/enviar`}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-line-input bg-raised px-4 text-sm font-semibold text-ink hover:bg-surface">
          <Upload aria-hidden className="size-4" /> Subir fotos
        </Link>
        {status === "draft" ? (
          <Button loading={busy === "send"} disabled={photoCount === 0}
            onClick={() => run("send", () => post("send"), "Galeria liberada para o cliente")}>
            <Send aria-hidden className="size-4" /> Liberar para o cliente
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}/g/${token}`); toast("success", "Link copiado"); }}>
              <Copy aria-hidden className="size-4" /> Copiar link
            </Button>
            <a href={`/g/${token}`} target="_blank" rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-ink hover:bg-surface">
              <ExternalLink aria-hidden className="size-4" /> Ver como cliente
            </a>
          </>
        )}
      </div>
      {status === "draft" && photoCount === 0 && <p className="text-sm text-muted">Suba as fotos antes de liberar.</p>}
      {(status === "submitted" || status === "expired") && (
        <form className="flex flex-wrap items-end gap-2 rounded-md bg-surface p-3"
          onSubmit={(e) => { e.preventDefault(); void run("reopen", () => post("reopen", { deadline: deadline || null }), "Seleção reaberta"); }}>
          <label className="flex flex-col gap-1 text-sm text-ink">
            {status === "expired" ? "Estender o prazo até" : "Reabrir para o cliente mudar, até"}
            <input type="date" min={minDate} value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="h-10 rounded-md border border-line-input bg-raised px-3 text-sm" />
          </label>
          <Button variant="secondary" loading={busy === "reopen"} type="submit">Reabrir</Button>
          <span className="text-xs text-muted">Em branco: sem prazo.</span>
        </form>
      )}
    </div>
  );
}

"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Dropzone, UploadList, type UploadItem } from "@/components/ui/UploadList";
import { createResizePool, putWithProgress } from "@/lib/upload/pool";

const ACCEPTED = /\.(jpe?g|png)$/i;
const BATCH = 50;

type Ticket = { name: string; skip: boolean; previewKey?: string; thumbKey?: string; previewUrl?: string; thumbUrl?: string };

export function Uploader({ galleryId, watermark, startCount }: { galleryId: string; watermark: string | null; startCount: number }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(0);
  const files = useRef(new Map<string, File>());

  const patch = useCallback((id: string, p: Partial<UploadItem>) =>
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x))), []);

  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  async function process(list: UploadItem[]) {
    setBusy(true);
    const pool = createResizePool();
    let total = 0;
    try {
      for (let i = 0; i < list.length; i += BATCH) {
        const batch = list.slice(i, i + BATCH);
        const res = await fetch(`/api/galleries/${galleryId}/uploads`, {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ files: batch.map((b) => ({ name: b.name })) }),
        });
        if (!res.ok) {
          batch.forEach((b) => patch(b.id, { status: "error", error: "Servidor recusou" }));
          continue;
        }
        const { files: tickets } = (await res.json()) as { files: Ticket[] };
        const done = await Promise.all(batch.map(async (item, j) => {
          const t = tickets[j];
          if (t.skip) { patch(item.id, { status: "done", progress: 100, error: undefined }); return null; }
          patch(item.id, { status: "uploading", progress: 5 });
          const out = await pool.run({ id: item.id, file: files.current.get(item.id)!, watermark });
          if (!out.ok) { patch(item.id, { status: "error", error: out.error }); return null; }
          try {
            await putWithProgress(t.thumbUrl!, out.thumb, () => {});
            await putWithProgress(t.previewUrl!, out.preview, (f) => patch(item.id, { progress: Math.max(10, Math.round(f * 95)) }));
          } catch {
            patch(item.id, { status: "error", error: "Falha no envio" });
            return null;
          }
          return { item, photo: { originalFilename: item.name, previewKey: t.previewKey!, thumbKey: t.thumbKey!, width: out.width, height: out.height, bytes: out.preview.size } };
        }));
        const ok = done.filter((d): d is NonNullable<typeof d> => !!d);
        if (ok.length) {
          const reg = await fetch(`/api/galleries/${galleryId}/photos`, {
            method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({ photos: ok.map((d) => d.photo) }),
          });
          if (reg.ok) {
            const { added: n } = (await reg.json()) as { added: number };
            total += n;
            ok.forEach((d) => patch(d.item.id, { status: "done", progress: 100 }));
          } else {
            ok.forEach((d) => patch(d.item.id, { status: "error", error: "Não registrou" }));
          }
        }
      }
    } finally {
      pool.close();
      setBusy(false);
      setAdded((a) => a + total);
      if (total) toast("success", `${total} ${total === 1 ? "foto enviada" : "fotos enviadas"}`);
      router.refresh();
    }
  }

  function onFiles(picked: File[]) {
    const fresh: UploadItem[] = [];
    for (const f of [...picked].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }))) {
      const id = `${f.name}-${f.size}-${f.lastModified}`;
      if (files.current.has(id)) continue;
      files.current.set(id, f);
      fresh.push(ACCEPTED.test(f.name)
        ? { id, name: f.name, progress: 0, status: "queued" }
        : { id, name: f.name, progress: 0, status: "error", error: "Use JPEG ou PNG" });
    }
    setItems((xs) => [...xs, ...fresh]);
    const todo = fresh.filter((x) => x.status === "queued");
    if (todo.length) void process(todo);
  }

  const failed = items.filter((i) => i.status === "error" && ACCEPTED.test(i.name));
  const finished = !busy && items.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <Dropzone onFiles={onFiles} disabled={busy} />
      {items.length > 0 && (
        <UploadList items={items} onRetry={busy ? undefined : (id) => {
          const it = items.find((x) => x.id === id);
          if (it) { patch(id, { status: "queued", error: undefined, progress: 0 }); void process([{ ...it, status: "queued" }]); }
        }} />
      )}
      {finished && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted" role="status">
            {startCount + added} fotos na galeria{failed.length ? ` · ${failed.length} com erro` : ""}.
          </p>
          <Link href={`/gerenciador/galerias/${galleryId}`}
            className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-hover">
            Continuar para a galeria
          </Link>
          {failed.length > 0 && (
            <Button variant="secondary" onClick={() => { failed.forEach((f) => patch(f.id, { status: "queued", error: undefined })); void process(failed); }}>
              Tentar as {failed.length} de novo
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

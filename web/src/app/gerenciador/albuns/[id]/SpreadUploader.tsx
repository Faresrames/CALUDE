"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createResizePool, putWithProgress } from "@/lib/upload/pool";

const ACCEPTED = /\.(jpe?g|png)$/i;

/** Nova versão: lâminas em ordem de nome, reduzidas para 2400px no navegador, sem marca d'água. */
export function SpreadUploader({ albumId, nextNumber }: { albumId: string; nextNumber: number }) {
  const router = useRouter();
  const toast = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [progress, setProgress] = useState<string | null>(null);

  async function publish() {
    if (!files.length) return;
    setProgress("Preparando…");
    const pool = createResizePool();
    try {
      const r = await fetch(`/api/albums/${albumId}/uploads`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ count: files.length }),
      });
      if (r.status === 401) throw new Error("Sua sessão expirou. Entre de novo.");
      if (!r.ok) throw new Error("O servidor recusou o envio.");
      const { files: tickets } = (await r.json()) as { files: { key: string; uploadUrl: string }[] };
      let done = 0;
      const spreads = await Promise.all(files.map(async (f, i) => {
        const out = await pool.run({ id: String(i), file: f, watermark: null, maxSide: 2400 });
        if (!out.ok) throw new Error(`${f.name}: ${out.error}`);
        await putWithProgress(tickets[i].uploadUrl, out.preview, () => {});
        setProgress(`Enviando ${++done} de ${files.length}…`);
        return { imageKey: tickets[i].key, width: out.width, height: out.height };
      }));
      const v = await fetch(`/api/albums/${albumId}/versions`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ note: note || null, spreads }),
      });
      if (!v.ok) throw new Error("Não deu para publicar a versão.");
      const { emailed } = (await v.json()) as { emailed: string };
      toast("success", `Versão ${nextNumber} publicada${emailed === "sent" ? " e o cliente foi avisado por e-mail" : ""}.`);
      setFiles([]); setNote("");
      router.refresh();
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      pool.close();
      setProgress(null);
    }
  }

  return (
    <section aria-labelledby="nv-t" className="flex flex-col gap-3 rounded-lg border border-line bg-raised p-5">
      <h2 id="nv-t" className="text-lg font-semibold text-ink">Nova versão ({nextNumber})</h2>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        Lâminas (JPEG ou PNG, na ordem do nome do arquivo)
        <input type="file" multiple accept="image/jpeg,image/png" disabled={!!progress}
          onChange={(e) => setFiles([...(e.target.files ?? [])].filter((f) => ACCEPTED.test(f.name))
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true })))}
          className="text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line-input file:bg-raised file:px-3 file:py-2 file:text-ink" />
      </label>
      {files.length > 0 && <p className="text-sm text-muted">{files.length} lâminas: {files.slice(0, 4).map((f) => f.name).join(", ")}{files.length > 4 ? "…" : ""}</p>}
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink" htmlFor="nv-note">Recado para o cliente (opcional)</label>
      <textarea id="nv-note" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} disabled={!!progress}
        placeholder="Ex.: troquei as fotos da página 4 como você pediu"
        className="resize-none rounded-md border border-line-input bg-raised px-3 py-2 text-sm text-ink placeholder:text-muted" />
      <div className="flex items-center gap-3">
        <Button onClick={publish} loading={!!progress} disabled={!files.length}>Publicar versão {nextNumber}</Button>
        {progress && <span role="status" className="text-sm text-muted">{progress}</span>}
      </div>
    </section>
  );
}

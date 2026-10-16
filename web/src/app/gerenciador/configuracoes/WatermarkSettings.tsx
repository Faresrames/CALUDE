"use client";
import { clsx } from "clsx";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { drawWatermark, type WatermarkPosition } from "@/lib/upload/watermark";
import { saveWatermark, type WatermarkState } from "./watermark-actions";

const positions: [WatermarkPosition, string][] = [["tiled", "Repetida em diagonal"], ["center", "No centro"], ["bottom-right", "No canto inferior direito"]];
const MAX_LOGO = 2 * 1024 * 1024;

export function WatermarkSettings(p: { text: string; imageUrl: string | null; imageKey: string | null; opacity: number; position: WatermarkPosition }) {
  const [state, action, pending] = useActionState<WatermarkState, FormData>(saveWatermark, {});
  const [mode, setMode] = useState<"text" | "image">(p.imageKey ? "image" : "text");
  const [text, setText] = useState(p.text);
  const [opacity, setOpacity] = useState(p.opacity);
  const [position, setPosition] = useState<WatermarkPosition>(p.position);
  const [key, setKey] = useState(p.imageKey ?? "");
  const [logo, setLogo] = useState<ImageBitmap | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!p.imageUrl) return;
    fetch(p.imageUrl).then((r) => r.blob()).then(createImageBitmap).then(setLogo).catch(() => {});
  }, [p.imageUrl]);

  // prévia ao vivo, com o mesmo desenho que vai nas fotos
  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const g = ctx.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, "#d9c7b0"); g.addColorStop(1, "#6b5a49"); // foto de exemplo
    ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
    drawWatermark(ctx, c.width, c.height, { text: mode === "text" ? text : null, image: mode === "image" ? logo : null, opacity, position });
  }, [mode, text, logo, opacity, position]);

  async function pick(file: File | undefined) {
    setError(undefined);
    if (!file) return;
    if (file.type !== "image/png") return setError("Use um arquivo PNG (de preferência com fundo transparente).");
    if (file.size > MAX_LOGO) return setError("O logo pode ter até 2 MB.");
    setUploading(true);
    try {
      const r = await fetch("/api/me/watermark", { method: "POST" });
      if (!r.ok) throw new Error();
      const { key: k, uploadUrl } = (await r.json()) as { key: string; uploadUrl: string };
      const put = await fetch(uploadUrl, { method: "PUT", headers: { "content-type": "image/png" }, body: file });
      if (!put.ok) throw new Error();
      setKey(k);
      setLogo(await createImageBitmap(file));
      setMode("image");
    } catch {
      setError("Não deu para enviar o logo. Tente de novo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-lg font-semibold text-ink">Marca d’água</legend>
        <p className="text-sm text-muted">Vale para as próximas fotos enviadas. As que já subiram ficam como estão.</p>
        <div role="radiogroup" aria-label="Tipo de marca d’água" className="flex gap-2">
          {(["text", "image"] as const).map((m) => (
            <label key={m} className={clsx("flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm",
              mode === m ? "border-ink text-ink" : "border-line text-muted")}>
              <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} />
              {m === "text" ? "Texto" : "Logo (PNG)"}
            </label>
          ))}
        </div>
        {mode === "text" ? (
          <Field label="Texto da marca d’água" name="text" value={text} maxLength={40} onChange={(e) => setText(e.target.value)} />
        ) : (
          <>
            <input type="hidden" name="text" value={text} />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Arquivo do logo
              <input type="file" accept="image/png" onChange={(e) => pick(e.target.files?.[0])} disabled={uploading}
                className="text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line-input file:bg-raised file:px-3 file:py-2 file:text-ink" />
              <span className="text-sm font-normal text-muted">PNG com fundo transparente, até 2 MB.{uploading ? " Enviando…" : ""}</span>
            </label>
          </>
        )}
        <input type="hidden" name="key" value={key} />
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Opacidade: {opacity}%
          <input type="range" name="opacity" min={5} max={100} step={5} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Posição
          <select name="position" value={position} onChange={(e) => setPosition(e.target.value as WatermarkPosition)}
            className="h-10 rounded-md border border-line-input bg-raised px-3 text-base">
            {positions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <figure className="flex flex-col gap-1">
          <canvas ref={canvas} width={480} height={320} role="img" aria-label="Prévia da marca d’água numa foto de exemplo"
            className="w-full max-w-md rounded-md border border-line" />
          <figcaption className="text-xs text-muted">Prévia numa foto de exemplo.</figcaption>
        </figure>
      </fieldset>
      {(error || state.error) && <p role="alert" className="text-sm text-danger">{error ?? state.error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending} disabled={uploading || (mode === "image" && !key)}>Salvar marca d’água</Button>
        {state.ok && <p role="status" className="text-sm text-success">Marca d’água salva.</p>}
      </div>
    </form>
  );
}

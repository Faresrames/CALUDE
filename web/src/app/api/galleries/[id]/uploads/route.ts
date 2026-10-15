import { randomUUID } from "node:crypto";
import { fail, handle, photographerOr401, unauthorized } from "@/lib/api";
import { data } from "@/lib/data";
import { storage } from "@/lib/storage";

/** Gera URLs assinadas para até 50 fotos por vez e diz quais já existem (para retomar). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await photographerOr401();
  if (!p) return unauthorized();
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { files?: { name: string }[] } | null;
  if (!body?.files?.length || body.files.length > 50) return fail("invalid", "Mande de 1 a 50 arquivos por vez.");
  return handle(async () => {
    const existing = new Set(await data.existingBasenames(p.id, id));
    return {
      files: body.files!.map((f) => {
        const basename = f.name.replace(/\.[^.]+$/, "");
        if (existing.has(basename)) return { name: f.name, skip: true };
        const stem = `g/${id}/${randomUUID()}`;
        return {
          name: f.name,
          skip: false,
          previewKey: `${stem}-p.jpg`,
          thumbKey: `${stem}-t.jpg`,
          previewUrl: storage.uploadUrl(`${stem}-p.jpg`),
          thumbUrl: storage.uploadUrl(`${stem}-t.jpg`),
        };
      }),
    };
  });
}


import { randomUUID } from "node:crypto";
import { body, fail, handle, photographerOr401, unauthorized } from "@/lib/api";
import { data, DataError } from "@/lib/data";
import { uploadsBody } from "@/lib/schemas";
import { storage } from "@/lib/storage";

/** Gera URLs assinadas para até 50 fotos por vez e diz quais já existem (para retomar). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await photographerOr401();
  if (!p) return unauthorized();
  const { id } = await params;
  const b = await body(req, uploadsBody);
  if (!b) return fail("invalid", "Mande de 1 a 50 arquivos por vez.");
  return handle(async () => {
    const existing = new Set(await data.existingBasenames(p.id, id));
    const fresh = b.files.filter((f) => !existing.has(f.name.replace(/\.[^.]+$/, ""))).length;
    const { used, limit } = await data.photoUsage(p.id);
    if (used + fresh > limit) throw new DataError("plan_limit");
    return {
      files: await Promise.all(b.files.map(async (f) => {
        if (existing.has(f.name.replace(/\.[^.]+$/, ""))) return { name: f.name, skip: true };
        const stem = `g/${id}/${randomUUID()}`;
        return {
          name: f.name, skip: false, previewKey: `${stem}-p.jpg`, thumbKey: `${stem}-t.jpg`,
          previewUrl: await storage.uploadUrl(`${stem}-p.jpg`, "image/jpeg"),
          thumbUrl: await storage.uploadUrl(`${stem}-t.jpg`, "image/jpeg"),
        };
      })),
    };
  });
}

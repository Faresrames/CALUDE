import { randomUUID } from "node:crypto";
import { body, fail, handle, photographerOr401, unauthorized } from "@/lib/api";
import { data, DataError } from "@/lib/data";
import { albumUploadsBody } from "@/lib/schemas";
import { storage } from "@/lib/storage";

/** URLs assinadas para as lâminas de uma nova versão do álbum. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await photographerOr401();
  if (!p) return unauthorized();
  const { id } = await params;
  const b = await body(req, albumUploadsBody);
  if (!b) return fail("invalid");
  return handle(async () => {
    if (!(await data.getAlbum(p.id, id))) throw new DataError("not_found");
    return {
      files: await Promise.all(Array.from({ length: b.count }, async () => {
        const key = `a/${id}/${randomUUID()}.jpg`;
        return { key, uploadUrl: await storage.uploadUrl(key, "image/jpeg") };
      })),
    };
  });
}

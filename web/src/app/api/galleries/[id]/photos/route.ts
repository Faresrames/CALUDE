import { body, fail, handle, photographerOr401, unauthorized } from "@/lib/api";
import { data } from "@/lib/data";
import { photosBody } from "@/lib/schemas";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await photographerOr401();
  if (!p) return unauthorized();
  const { id } = await params;
  const b = await body(req, photosBody);
  const prefix = `g/${id}/`;
  // só aceita chaves dentro da pasta desta galeria (emitidas por /uploads)
  if (!b || b.photos.some((x) => !x.previewKey.startsWith(prefix) || !x.thumbKey.startsWith(prefix))) return fail("invalid");
  return handle(async () => ({ added: (await data.addPhotos(p.id, id, b.photos)).length }));
}

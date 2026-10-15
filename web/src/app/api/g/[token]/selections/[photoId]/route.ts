import { clientGallery, fail, handle } from "@/lib/api";
import { data } from "@/lib/data";

/** Marca/desmarca/favorita. Salva na hora e devolve a contagem confirmada. */
export async function PUT(req: Request, { params }: { params: Promise<{ token: string; photoId: string }> }) {
  const { token, photoId } = await params;
  const g = await clientGallery(token);
  if (!g) return fail("not_found");
  const body = (await req.json().catch(() => ({}))) as { selected?: unknown; favorited?: unknown };
  const patch: { selected?: boolean; favorited?: boolean } = {};
  if (typeof body.selected === "boolean") patch.selected = body.selected;
  if (typeof body.favorited === "boolean") patch.favorited = body.favorited;
  if (!Object.keys(patch).length) return fail("invalid");
  return handle(() => data.setSelection(g.id, photoId, patch));
}

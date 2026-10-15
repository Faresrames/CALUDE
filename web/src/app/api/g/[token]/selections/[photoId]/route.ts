import { body, clientGallery, fail, handle } from "@/lib/api";
import { data } from "@/lib/data";
import { selectionBody } from "@/lib/schemas";

/** Marca/desmarca/favorita. Salva na hora e devolve a contagem confirmada. */
export async function PUT(req: Request, { params }: { params: Promise<{ token: string; photoId: string }> }) {
  const { token, photoId } = await params;
  const g = await clientGallery(token);
  if (!g) return fail("not_found");
  const b = await body(req, selectionBody);
  if (!b) return fail("invalid");
  return handle(() => data.setSelection(g.id, photoId, b));
}

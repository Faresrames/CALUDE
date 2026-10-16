import { body, clientGallery, fail, handle, rateLimited } from "@/lib/api";
import { data } from "@/lib/data";
import { spreadCommentBody } from "@/lib/schemas";

/** Cliente comenta num ponto da lâmina (x,y de 0 a 1) ou na lâmina toda. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const g = await clientGallery((await params).token);
  if (!g) return fail("not_found");
  if (rateLimited(`album-comment:${g.id}`, 30, 60_000)) return fail("invalid", "Muitos comentários seguidos. Espere um pouco.");
  const b = await body(req, spreadCommentBody);
  if (!b) return fail("invalid");
  return handle(() => data.addSpreadComment(g.id, b.spreadId, { x: b.x, y: b.y, body: b.body }));
}

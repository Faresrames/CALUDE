import { body, clientGallery, fail, handle, rateLimited } from "@/lib/api";
import { data } from "@/lib/data";
import { commentBody } from "@/lib/schemas";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const g = await clientGallery((await params).token);
  if (!g) return fail("not_found");
  return handle(() => data.listComments(g.id));
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const g = await clientGallery((await params).token);
  if (!g) return fail("not_found");
  if (rateLimited(`comment:${g.id}`, 30, 60_000)) return fail("invalid", "Muitos comentários seguidos. Espere um pouco.");
  const b = await body(req, commentBody);
  if (!b) return fail("invalid");
  return handle(() => data.addComment(g.id, { photoId: b.photoId ?? null, author: "client", body: b.body }));
}

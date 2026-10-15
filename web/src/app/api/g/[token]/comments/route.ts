import { clientGallery, fail, handle } from "@/lib/api";
import { data } from "@/lib/data";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const g = await clientGallery((await params).token);
  if (!g) return fail("not_found");
  return handle(() => data.listComments(g.id));
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const g = await clientGallery((await params).token);
  if (!g) return fail("not_found");
  const body = (await req.json().catch(() => ({}))) as { photoId?: string | null; body?: string };
  if (typeof body.body !== "string") return fail("invalid");
  return handle(() => data.addComment(g.id, { photoId: body.photoId ?? null, author: "client", body: body.body! }));
}

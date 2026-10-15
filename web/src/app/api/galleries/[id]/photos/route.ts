import { fail, handle, photographerOr401, unauthorized } from "@/lib/api";
import { data, type NewPhotoInput } from "@/lib/data";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await photographerOr401();
  if (!p) return unauthorized();
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { photos?: NewPhotoInput[] } | null;
  const photos = body?.photos;
  const prefix = `g/${id}/`;
  if (!photos?.length || photos.length > 50) return fail("invalid");
  if (photos.some((x) => !x.previewKey?.startsWith(prefix) || !x.thumbKey?.startsWith(prefix) || !x.originalFilename)) {
    return fail("invalid");
  }
  return handle(async () => ({ added: (await data.addPhotos(p.id, id, photos)).length }));
}

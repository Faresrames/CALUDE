import { body, fail, handle, photographerOr401, unauthorized } from "@/lib/api";
import { data, DataError } from "@/lib/data";
import { env } from "@/lib/env";
import { albumReadyMail } from "@/lib/mail/templates";
import { notify } from "@/lib/notify";
import { albumVersionBody } from "@/lib/schemas";

/** Publica uma nova versão do álbum e avisa o cliente. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await photographerOr401();
  if (!p) return unauthorized();
  const { id } = await params;
  const b = await body(req, albumVersionBody);
  if (!b || b.spreads.some((s) => !s.imageKey.startsWith(`a/${id}/`))) return fail("invalid");
  return handle(async () => {
    const album = await data.getAlbum(p.id, id);
    if (!album) throw new DataError("not_found");
    const v = await data.addAlbumVersion(p.id, id, { note: b.note ?? null, spreads: b.spreads });
    const g = await data.getGallery(p.id, album.galleryId);
    const emailed = g?.clientEmail
      ? await notify(g.id, "album_ready", albumReadyMail(g.clientEmail, {
          title: g.title, studio: p.businessName ?? p.name, clientName: g.clientName, number: v.number, note: v.note,
          url: `${env.appUrl}/g/${g.accessToken}/album`,
        }))
      : "skipped";
    return { number: v.number, emailed };
  });
}

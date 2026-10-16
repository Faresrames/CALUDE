import { body, clientGallery, fail, handle } from "@/lib/api";
import { data } from "@/lib/data";
import { env } from "@/lib/env";
import { albumDecidedMail } from "@/lib/mail/templates";
import { notify } from "@/lib/notify";
import { albumDecisionBody } from "@/lib/schemas";

/** Cliente aprova a versão ou pede ajustes; o fotógrafo é avisado. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const g = await clientGallery((await params).token);
  if (!g) return fail("not_found");
  const b = await body(req, albumDecisionBody);
  if (!b) return fail("invalid");
  return handle(async () => {
    const v = await data.decideAlbumVersion(g.id, b.versionId, b.decision);
    const [p, album] = await Promise.all([data.getPhotographer(g.photographerId), data.getAlbumForGallery(g.id)]);
    if (p && album) {
      await notify(g.id, "album_decided", albumDecidedMail(p.email, {
        title: g.title, clientName: g.clientName, number: v.number, approved: v.status === "approved",
        comments: v.spreads.reduce((n, s) => n + s.comments.length, 0), url: `${env.appUrl}/gerenciador/albuns/${album.id}`,
      }));
    }
    return { number: v.number, status: v.status };
  });
}

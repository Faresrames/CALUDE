import { clientGallery, fail, handle } from "@/lib/api";
import { data } from "@/lib/data";
import { env } from "@/lib/env";
import { submittedMail } from "@/lib/mail/templates";
import { notify } from "@/lib/notify";

/** Cliente finaliza: trava a galeria, cria o pedido das extras e avisa o fotógrafo. */
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const g = await clientGallery((await params).token);
  if (!g) return fail("not_found");
  return handle(async () => {
    const r = await data.submitSelection(g.id);
    const p = await data.getPhotographer(g.photographerId);
    if (p) {
      await notify(g.id, "submitted", submittedMail(p.email, {
        title: g.title, clientName: g.clientName, total: r.total, extras: r.extras, extrasCents: r.extrasCents,
        url: `${env.appUrl}/gerenciador/galerias/${g.id}`,
      }));
    }
    return { total: r.total, extras: r.extras, extrasCents: r.extrasCents, hasOrder: !!r.order };
  });
}

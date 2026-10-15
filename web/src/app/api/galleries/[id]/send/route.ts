import { handle, photographerOr401, unauthorized } from "@/lib/api";
import { data } from "@/lib/data";
import { env } from "@/lib/env";
import { gallerySentMail } from "@/lib/mail/templates";
import { notify } from "@/lib/notify";

/** Libera a galeria e manda o link para o cliente por e-mail (se tiver e-mail). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await photographerOr401();
  if (!p) return unauthorized();
  const { id } = await params;
  return handle(async () => {
    await data.sendGallery(p.id, id);
    const g = (await data.getGallery(p.id, id))!;
    const emailed = g.clientEmail
      ? await notify(g.id, "gallery_sent", gallerySentMail(g.clientEmail, {
          title: g.title, studio: p.businessName ?? p.name, clientName: g.clientName, packageSize: g.packageSize,
          deadlineAt: g.deadlineAt, url: `${env.appUrl}/g/${g.accessToken}`,
        }))
      : "skipped";
    return { status: g.status, emailed };
  });
}

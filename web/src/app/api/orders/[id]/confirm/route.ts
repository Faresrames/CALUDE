import { handle, photographerOr401, unauthorized } from "@/lib/api";
import { data } from "@/lib/data";
import { env } from "@/lib/env";
import { orderPaidMail } from "@/lib/mail/templates";
import { notify } from "@/lib/notify";

/** O fotógrafo confirma que o PIX das extras caiu na conta dele. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await photographerOr401();
  if (!p) return unauthorized();
  const { id } = await params;
  return handle(async () => {
    const order = await data.confirmOrder(p.id, id);
    const g = await data.getGallery(p.id, order.galleryId);
    if (g?.clientEmail) {
      await notify(g.id, "order_paid", orderPaidMail(g.clientEmail, {
        title: g.title, studio: p.businessName ?? p.name, amountCents: order.amountCents, url: `${env.appUrl}/g/${g.accessToken}`,
      }));
    }
    return order;
  });
}

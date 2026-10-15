import { NextResponse } from "next/server";
import { sameSecret } from "@/lib/api";
import { data } from "@/lib/data";
import { env } from "@/lib/env";
import { expiredMail, reminderMail } from "@/lib/mail/templates";
import { notify } from "@/lib/notify";

// Vercel Cron chama com "Authorization: Bearer $CRON_SECRET" (vercel.json).
// Pode rodar várias vezes por dia: cada aviso sai no máximo uma vez (tabela notifications).
export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!sameSecret(token, process.env.CRON_SECRET)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const now = new Date();
  const out = { expired: 0, reminders: { sent: 0, skipped: 0, failed: 0 }, ordersExpired: 0 };

  for (const g of await data.expireOverdueGalleries(now)) {
    out.expired++;
    await notify(g.galleryId, "expired", expiredMail(g.photographerEmail, {
      title: g.title, clientName: g.clientName, url: `${env.appUrl}/gerenciador/galerias/${g.galleryId}`,
    }));
  }
  for (const t of await data.reminderTargets(now)) {
    const r = await notify(t.galleryId, t.kind, reminderMail(t.clientEmail, {
      title: t.title, studio: t.studioName, clientName: t.clientName, deadlineAt: t.deadlineAt, url: `${env.appUrl}/g/${t.accessToken}`,
    }, t.kind));
    out.reminders[r]++;
  }
  out.ordersExpired = await data.expireStaleOrders(72);
  return NextResponse.json(out);
}

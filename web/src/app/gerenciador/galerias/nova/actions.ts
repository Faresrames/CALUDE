"use server";
import { redirect } from "next/navigation";
import { requirePhotographer } from "@/lib/auth";
import { data } from "@/lib/data";
import { endOfDayInTZ, parseBRL } from "@/lib/format";

export type NewGalleryState = { errors: Partial<Record<"title" | "clientName" | "packageSize" | "extraPrice" | "deadline" | "password", string>>; values?: Record<string, string> };

export async function createGalleryAction(_prev: NewGalleryState, form: FormData): Promise<NewGalleryState> {
  const p = await requirePhotographer();
  const v = (k: string) => String(form.get(k) ?? "").trim();
  const errors: NewGalleryState["errors"] = {};

  const title = v("title");
  if (!title) errors.title = "Dê um nome para a galeria.";
  else if (title.length > 120) errors.title = "Use até 120 caracteres.";
  const clientName = v("clientName");
  if (!clientName) errors.clientName = "Quem vai escolher as fotos?";
  const packageSize = Number(v("packageSize"));
  if (!Number.isInteger(packageSize) || packageSize < 1 || packageSize > 5000) errors.packageSize = "Um número entre 1 e 5000.";
  const allowExtras = v("allowExtras") === "on";
  const extraPriceCents = allowExtras ? parseBRL(v("extraPrice") || "0") : 0;
  if (allowExtras && (extraPriceCents === null || extraPriceCents <= 0)) errors.extraPrice = "Informe o valor de cada foto extra, ex.: 25,00.";
  const deadlineRaw = v("deadline");
  const deadlineAt = deadlineRaw ? endOfDayInTZ(deadlineRaw) : null;
  if (deadlineRaw && (!deadlineAt || new Date(deadlineAt) < new Date())) errors.deadline = "Escolha uma data a partir de hoje.";
  const password = v("password");
  if (password && password.length < 4) errors.password = "Use pelo menos 4 caracteres, ou deixe em branco.";

  if (Object.keys(errors).length) return { errors, values: Object.fromEntries([...form.entries()].map(([k, x]) => [k, String(x)])) };

  const g = await data.createGallery(p.id, {
    title, eventDate: v("eventDate") || null, clientName, clientEmail: v("clientEmail") || null, packageSize,
    allowExtras, extraPriceCents: extraPriceCents ?? 0, deadlineAt, password: password || null,
    allowComments: v("allowComments") === "on", watermarkOn: v("watermarkOn") === "on",
  });
  redirect(`/gerenciador/galerias/${g.id}/enviar`);
}

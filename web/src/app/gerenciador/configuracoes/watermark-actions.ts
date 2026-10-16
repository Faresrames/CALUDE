"use server";
import { z } from "zod";
import { requirePhotographer } from "@/lib/auth";
import { data } from "@/lib/data";

export type WatermarkState = { ok?: boolean; error?: string };

const schema = z.object({
  mode: z.enum(["text", "image"]),
  text: z.string().trim().max(40),
  key: z.string().max(200),
  opacity: z.coerce.number().int().min(5).max(100),
  position: z.enum(["center", "tiled", "bottom-right"]),
});

export async function saveWatermark(_prev: WatermarkState, form: FormData): Promise<WatermarkState> {
  const p = await requirePhotographer();
  const r = schema.safeParse(Object.fromEntries(form));
  if (!r.success) return { error: "Confira os campos da marca d’água." };
  const v = r.data;
  if (v.mode === "image" && !v.key.startsWith(`w/${p.id}/`)) return { error: "Escolha um arquivo PNG para o logo." };
  if (v.mode === "text" && !v.text) return { error: "Escreva o texto da marca d’água." };
  await data.updatePhotographer(p.id, {
    watermarkText: v.text || null,
    watermarkKey: v.mode === "image" ? v.key : null,
    watermarkOpacity: v.opacity,
    watermarkPosition: v.position,
  });
  return { ok: true };
}

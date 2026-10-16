import { randomUUID } from "node:crypto";
import { photographerOr401, unauthorized } from "@/lib/api";
import { storage } from "@/lib/storage";
import { NextResponse } from "next/server";

/** URL assinada para enviar o logo PNG da marca d'água (a tela salva a chave depois). */
export async function POST() {
  const p = await photographerOr401();
  if (!p) return unauthorized();
  const key = `w/${p.id}/${randomUUID()}.png`;
  return NextResponse.json({ key, uploadUrl: await storage.uploadUrl(key, "image/png") });
}

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { currentPhotographer, isGalleryUnlocked } from "./auth";
import { data, DataError, type DataErrorCode } from "./data";

const messages: Record<DataErrorCode, [number, string]> = {
  not_found: [404, "Não encontrado."],
  gallery_locked: [409, "Esta seleção já foi enviada. Se quiser mudar algo, peça ao fotógrafo para reabrir."],
  gallery_expired: [409, "O prazo para escolher terminou. Peça ao fotógrafo mais alguns dias: suas escolhas continuam salvas."],
  package_full: [409, "Seu pacote já está completo. Para trocar, desmarque uma foto antes."],
  comments_off: [403, "Comentários desligados nesta galeria."],
  album_locked: [409, "Esta versão do álbum já foi decidida. Espere a próxima versão do fotógrafo."],
  plan_inactive: [402, "Seu período de teste acabou. Escolha um plano para criar galerias novas."],
  invalid: [400, "Dados inválidos."],
};

export function fail(code: DataErrorCode, message?: string) {
  const [status, text] = messages[code];
  return NextResponse.json({ error: code, message: message ?? text }, { status });
}

/** Converte DataError na resposta certa; qualquer outro erro vira 500. */
export async function handle<T>(fn: () => Promise<T>) {
  try {
    return NextResponse.json(await fn());
  } catch (e) {
    if (e instanceof DataError) return fail(e.code, e.code === "invalid" && e.message !== "invalid" ? e.message : undefined);
    console.error(e);
    return NextResponse.json({ error: "server", message: "Algo deu errado. Tente de novo." }, { status: 500 });
  }
}

export async function photographerOr401() {
  const p = await currentPhotographer();
  return p ?? null;
}

export const unauthorized = () => NextResponse.json({ error: "unauthorized", message: "Entre de novo." }, { status: 401 });

/** Galeria vista pelo cliente: existe, já foi enviada e a senha (se houver) foi aceita. */
export async function clientGallery(token: string) {
  const g = await data.getGalleryByToken(token);
  if (!g || g.status === "draft" || g.status === "archived") return null;
  if (!(await isGalleryUnlocked(g.id, !!g.passwordHash))) return null;
  return g;
}

/** Limite simples por chave (em memória). No real: Upstash/Redis ou o próprio banco. */
const hits = new Map<string, number[]>();
export function rateLimited(key: string, max: number, windowMs: number) {
  const t = Date.now();
  const list = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
  list.push(t);
  hits.set(key, list);
  return list.length > max;
}

/** Lê e valida o JSON do corpo. null se inválido. */
export async function body<T>(req: Request, schema: z.ZodType<T>): Promise<T | null> {
  const raw = await req.json().catch(() => undefined);
  const r = schema.safeParse(raw);
  return r.success ? r.data : null;
}

/** Comparação de segredos sem vazar tempo. */
export function sameSecret(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

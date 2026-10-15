import { NextResponse } from "next/server";
import { currentPhotographer, isGalleryUnlocked } from "./auth";
import { data, DataError, type DataErrorCode } from "./data";

const messages: Record<DataErrorCode, [number, string]> = {
  not_found: [404, "Não encontrado."],
  gallery_locked: [409, "Esta seleção já foi enviada. Fale com o fotógrafo para reabrir."],
  gallery_expired: [409, "O prazo para escolher terminou. Fale com o fotógrafo para estender."],
  package_full: [409, "O pacote está completo. Desmarque uma foto para escolher outra."],
  comments_off: [403, "Comentários desligados nesta galeria."],
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

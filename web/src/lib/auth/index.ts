// Login de DEMONSTRAÇÃO do fotógrafo: cookie assinado com o id.
// /replica-backend troca por Supabase Auth (e-mail + Google).
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { data, type Photographer } from "../data";
import { sign, verify } from "../secret";

const COOKIE = "ph_session";

export async function startSession(photographerId: string) {
  (await cookies()).set(COOKIE, `${photographerId}.${sign(`ph:${photographerId}`)}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function currentPhotographer(): Promise<Photographer | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [id, sig] = raw.split(".");
  if (!id || !verify(`ph:${id}`, sig)) return null;
  return data.getPhotographer(id);
}

export async function requirePhotographer(): Promise<Photographer> {
  const p = await currentPhotographer();
  if (!p) redirect("/entrar");
  return p;
}

// ── acesso do cliente à galeria (sem conta: token do link + senha opcional) ──
const gCookie = (galleryId: string) => `g_${galleryId}`;

export async function unlockGallery(galleryId: string) {
  (await cookies()).set(gCookie(galleryId), sign(`g:${galleryId}`), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function isGalleryUnlocked(galleryId: string, hasPassword: boolean) {
  if (!hasPassword) return true;
  return verify(`g:${galleryId}`, (await cookies()).get(gCookie(galleryId))?.value);
}

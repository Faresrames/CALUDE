// Sessão do fotógrafo. Produção: Supabase Auth (link mágico por e-mail e Google).
// Desenvolvimento sem Supabase: login de demonstração (cookie assinado).
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { data, type Photographer } from "../data";
import { sql } from "../data/db";
import { env } from "../env";
import { sign, verify } from "../secret";
import { supabaseAdmin, supabaseServer } from "./supabase";

const DEMO_COOKIE = "ph_session";
const cookieOpts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 };

export async function currentPhotographer(): Promise<Photographer | null> {
  if (env.auth === "supabase") {
    const { data: auth } = await (await supabaseServer()).auth.getUser();
    const u = auth.user;
    if (!u?.email) return null;
    const existing = await data.getPhotographer(u.id);
    if (existing) return existing;
    const name = (u.user_metadata?.full_name as string | undefined) ?? (u.user_metadata?.name as string | undefined) ?? u.email.split("@")[0];
    return data.ensurePhotographer(u.id, u.email, name);
  }
  const raw = (await cookies()).get(DEMO_COOKIE)?.value;
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

/** Só no modo demonstração: entra direto pelo e-mail (cria o usuário local). */
export async function demoSignIn(email: string, name: string) {
  if (env.auth !== "demo") throw new Error("login de demonstração desligado");
  const e = email.trim().toLowerCase();
  let p = await data.getPhotographerByEmail(e);
  if (!p) {
    const [u] = await sql()<{ id: string }[]>`insert into auth.users (id, email) values (gen_random_uuid(), ${e}) returning id`;
    p = await data.ensurePhotographer(u.id, e, name);
  }
  (await cookies()).set(DEMO_COOKIE, `${p.id}.${sign(`ph:${p.id}`)}`, cookieOpts);
}

/** Sai de todos os aparelhos. */
export async function endSession() {
  if (env.auth === "supabase") await (await supabaseServer()).auth.signOut({ scope: "global" });
  (await cookies()).delete(DEMO_COOKIE);
}

/** Apaga a conta de verdade: dados (cascade), arquivos e o usuário de login. */
export async function deleteAccount(p: Photographer, removeFiles: (keys: string[]) => Promise<void>) {
  const keys = await data.deletePhotographer(p.id);
  await removeFiles(keys);
  if (env.auth === "supabase") {
    const { error } = await supabaseAdmin().auth.admin.deleteUser(p.id);
    if (error) throw error;
  } else {
    await sql()`delete from auth.users where id = ${p.id}`;
  }
  await endSession();
}

// ── acesso do cliente à galeria (sem conta: token do link + senha opcional) ──
const gCookie = (galleryId: string) => `g_${galleryId}`;

export async function unlockGallery(galleryId: string) {
  (await cookies()).set(gCookie(galleryId), sign(`g:${galleryId}`), cookieOpts);
}

export async function isGalleryUnlocked(galleryId: string, hasPassword: boolean) {
  if (!hasPassword) return true;
  return verify(`g:${galleryId}`, (await cookies()).get(gCookie(galleryId))?.value);
}

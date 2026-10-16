"use server";
import { redirect } from "next/navigation";
import { requirePhotographer } from "@/lib/auth";
import { data, DataError } from "@/lib/data";

export type NewAlbumState = { error?: string };

export async function createAlbumAction(_prev: NewAlbumState, form: FormData): Promise<NewAlbumState> {
  const p = await requirePhotographer();
  const galleryId = String(form.get("galleryId") ?? "");
  const title = String(form.get("title") ?? "").trim();
  if (!galleryId) return { error: "Escolha a galeria do álbum." };
  if (!title) return { error: "Dê um nome para o álbum." };
  let id: string;
  try {
    ({ id } = await data.createAlbum(p.id, galleryId, title));
  } catch (e) {
    if (e instanceof DataError) return { error: e.message !== e.code ? e.message : "Não deu para criar o álbum." };
    throw e;
  }
  redirect(`/gerenciador/albuns/${id}`);
}

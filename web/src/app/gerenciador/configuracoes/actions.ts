"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { deleteAccount, requirePhotographer } from "@/lib/auth";
import { data } from "@/lib/data";
import { normalizePixKey, type PixKeyType } from "@/lib/pix";
import { storage } from "@/lib/storage";

export type SettingsState = { ok?: boolean; errors: Partial<Record<"name" | "pixKey" | "pixMerchantCity" | "confirm", string>> };

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  businessName: z.string().trim().max(80),
  watermarkText: z.string().trim().max(40),
  pixKeyType: z.enum(["", "cpf", "cnpj", "email", "phone", "random"]),
  pixKey: z.string().trim().max(77),
  pixMerchantName: z.string().trim().max(60),
  pixMerchantCity: z.string().trim().max(40),
});

export async function saveSettings(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const p = await requirePhotographer();
  const r = schema.safeParse(Object.fromEntries(form));
  if (!r.success) return { errors: { name: "Confira os campos (nome é obrigatório)." } };
  const v = r.data;
  let pixKey: string | null = null;
  if (v.pixKeyType || v.pixKey) {
    pixKey = v.pixKeyType ? normalizePixKey(v.pixKeyType as PixKeyType, v.pixKey) : null;
    if (!pixKey) return { errors: { pixKey: "Chave PIX inválida para o tipo escolhido." } };
    if (!v.pixMerchantCity) return { errors: { pixMerchantCity: "O PIX pede a cidade de quem recebe." } };
  }
  await data.updatePhotographer(p.id, {
    name: v.name, businessName: v.businessName || null, watermarkText: v.watermarkText || null,
    pixKeyType: pixKey ? (v.pixKeyType as PixKeyType) : null, pixKey,
    pixMerchantName: pixKey ? v.pixMerchantName || v.businessName || v.name : null,
    pixMerchantCity: pixKey ? v.pixMerchantCity : null,
  });
  return { ok: true, errors: {} };
}

export async function removeAccount(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const p = await requirePhotographer();
  if (String(form.get("confirm") ?? "").trim().toLowerCase() !== p.email) {
    return { errors: { confirm: "Digite o seu e-mail exatamente para confirmar." } };
  }
  await deleteAccount(p, (keys) => storage.delete(keys));
  redirect("/entrar");
}

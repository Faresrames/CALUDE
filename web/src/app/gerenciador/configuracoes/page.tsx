import type { Metadata } from "next";
import { requirePhotographer } from "@/lib/auth";
import { SettingsForms } from "./SettingsForms";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const p = await requirePhotographer();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl text-ink">Configurações</h1>
      <SettingsForms p={p} />
    </div>
  );
}

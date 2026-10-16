import type { Metadata } from "next";
import { requirePhotographer } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { SettingsForms } from "./SettingsForms";
import { WatermarkSettings } from "./WatermarkSettings";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const p = await requirePhotographer();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl text-ink">Configurações</h1>
      <section className="max-w-2xl rounded-lg border border-line bg-raised p-5">
        <WatermarkSettings text={p.watermarkText ?? p.businessName ?? p.name} imageKey={p.watermarkKey}
          imageUrl={p.watermarkKey ? await storage.viewUrl(p.watermarkKey) : null} opacity={p.watermarkOpacity} position={p.watermarkPosition} />
      </section>
      <SettingsForms p={p} />
    </div>
  );
}

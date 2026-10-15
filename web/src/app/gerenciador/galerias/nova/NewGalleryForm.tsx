"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { createGalleryAction, type NewGalleryState } from "./actions";

export function NewGalleryForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<NewGalleryState, FormData>(createGalleryAction, { errors: {} });
  const val = state.values ?? {};
  const [extras, setExtras] = useState(val.allowExtras ? val.allowExtras === "on" : true);
  const [watermark, setWatermark] = useState(val.watermarkOn ? val.watermarkOn === "on" : true);
  const [comments, setComments] = useState(val.allowComments ? val.allowComments === "on" : true);
  const e = state.errors;

  return (
    <form action={action} noValidate className="flex max-w-2xl flex-col gap-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-lg font-semibold text-ink">O evento</legend>
        <Field className="sm:col-span-2" label="Nome da galeria" name="title" placeholder="Casamento Ana & Pedro" maxLength={120}
          defaultValue={val.title} error={e.title} required />
        <Field label="Data do evento" name="eventDate" type="date" defaultValue={val.eventDate} />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-lg font-semibold text-ink">Quem escolhe</legend>
        <Field label="Nome do cliente" name="clientName" autoComplete="off" defaultValue={val.clientName} error={e.clientName} required />
        <Field label="E-mail do cliente" name="clientEmail" type="email" autoComplete="off" defaultValue={val.clientEmail}
          hint="Para mandar o link e os lembretes." />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-lg font-semibold text-ink">Regras da seleção</legend>
        <Field label="Fotos no pacote" name="packageSize" type="number" inputMode="numeric" min={1} defaultValue={val.packageSize ?? "60"}
          error={e.packageSize} hint="Quantas o cliente escolhe sem pagar a mais." />
        <Field label="Prazo para escolher" name="deadline" type="date" min={today} defaultValue={val.deadline} error={e.deadline}
          hint="Vale até 23:59 (Brasília). Em branco: sem prazo." />
        <div className="flex flex-col gap-4 rounded-lg border border-line bg-raised p-4 sm:col-span-2">
          <Switch name="allowExtras" label="Permitir fotos extras" description="O cliente pode passar do pacote e paga cada foto a mais."
            checked={extras} onChange={setExtras} />
          {extras && (
            <Field label="Preço por foto extra (R$)" name="extraPrice" inputMode="decimal" placeholder="25,00"
              defaultValue={val.extraPrice} error={e.extraPrice} />
          )}
          <Switch name="watermarkOn" label="Marca d’água nas fotos" description="Aplicada nas prévias, antes do envio." checked={watermark} onChange={setWatermark} />
          <Switch name="allowComments" label="Comentários" description="O cliente pode deixar recados em cada foto." checked={comments} onChange={setComments} />
        </div>
        <Field label="Senha do link" name="password" type="text" autoComplete="off" defaultValue={val.password} error={e.password}
          hint="Opcional. Quem tiver o link e a senha vê a galeria." />
      </fieldset>

      <div className="flex gap-3">
        <Button type="submit" size="lg" loading={pending}>Criar e subir fotos</Button>
      </div>
    </form>
  );
}

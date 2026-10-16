"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { createAlbumAction, type NewAlbumState } from "./actions";

export function NewAlbumForm({ galleries }: { galleries: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState<NewAlbumState, FormData>(createAlbumAction, {});
  return (
    <form action={action} className="flex flex-col gap-4 rounded-lg border border-line bg-raised p-5 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-ink">
        Galeria
        <select name="galleryId" defaultValue="" required className="h-10 rounded-md border border-line-input bg-raised px-3 text-base">
          <option value="" disabled>Escolha…</option>
          {galleries.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
        </select>
      </label>
      <Field className="flex-1" label="Nome do álbum" name="title" defaultValue="Álbum" maxLength={120} />
      <Button type="submit" loading={pending}>Criar álbum</Button>
      {state.error && <p role="alert" className="text-sm text-danger sm:basis-full">{state.error}</p>}
    </form>
  );
}

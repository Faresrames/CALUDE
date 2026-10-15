"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { Photographer } from "@/lib/data/types";
import { removeAccount, saveSettings, type SettingsState } from "./actions";

const keyTypes = [
  ["", "Sem PIX"], ["cpf", "CPF"], ["cnpj", "CNPJ"], ["email", "E-mail"], ["phone", "Celular"], ["random", "Chave aleatória"],
] as const;

export function SettingsForms({ p }: { p: Photographer }) {
  const [state, save, saving] = useActionState<SettingsState, FormData>(saveSettings, { errors: {} });
  const [del, remove, removing] = useActionState<SettingsState, FormData>(removeAccount, { errors: {} });
  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <form action={save} className="flex flex-col gap-8">
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-lg font-semibold text-ink">Você e o estúdio</legend>
          <Field label="Seu nome" name="name" defaultValue={p.name} error={state.errors.name} required />
          <Field label="Nome do estúdio" name="businessName" defaultValue={p.businessName ?? ""} hint="Aparece para o cliente na galeria e nos e-mails." />
          <Field label="Texto da marca d’água" name="watermarkText" defaultValue={p.watermarkText ?? ""} maxLength={40}
            hint="Vale para as próximas fotos enviadas." />
        </fieldset>
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-1 text-lg font-semibold text-ink">PIX para as fotos extras</legend>
          <p className="text-sm text-muted sm:col-span-2">O cliente paga direto para você. A gente só monta o QR Code com o valor certo.</p>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Tipo de chave
            <select name="pixKeyType" defaultValue={p.pixKeyType ?? ""} className="h-10 rounded-md border border-line-input bg-raised px-3 text-base">
              {keyTypes.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <Field label="Chave PIX" name="pixKey" defaultValue={p.pixKey ?? ""} error={state.errors.pixKey} autoComplete="off" />
          <Field label="Nome de quem recebe" name="pixMerchantName" defaultValue={p.pixMerchantName ?? ""} hint="Como aparece no banco do cliente." />
          <Field label="Cidade" name="pixMerchantCity" defaultValue={p.pixMerchantCity ?? ""} error={state.errors.pixMerchantCity} />
        </fieldset>
        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>Salvar</Button>
          {state.ok && <p role="status" className="text-sm text-success">Salvo.</p>}
        </div>
      </form>

      <form action={remove} className="flex flex-col gap-3 rounded-lg border border-danger p-5">
        <h2 className="text-lg font-semibold text-ink">Apagar conta</h2>
        <p className="text-sm text-muted">
          Apaga para sempre suas galerias, fotos, seleções e clientes, e cancela o acesso. Não dá para desfazer.
          Cancele o plano antes, se tiver um.
        </p>
        <Field label={`Digite ${p.email} para confirmar`} name="confirm" autoComplete="off" error={del.errors.confirm} />
        <Button type="submit" variant="danger" loading={removing} className="self-start">Apagar minha conta</Button>
      </form>
    </div>
  );
}

"use client";
import { clsx } from "clsx";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { PlanInfo } from "@/lib/billing/plans";
import { formatBRL } from "@/lib/format";
import { cancel, subscribe, type PlanState } from "./actions";

export function PlanPicker({ plans, current }: { plans: PlanInfo[]; current: string | null }) {
  const [state, action, pending] = useActionState<PlanState, FormData>(subscribe, {});
  const [chosen, setChosen] = useState(current ?? "pro");
  return (
    <form action={action} className="flex flex-col gap-5">
      <fieldset className="grid gap-3 md:grid-cols-3">
        <legend className="sr-only">Planos</legend>
        {plans.map((pl) => (
          <label key={pl.id} className={clsx("flex cursor-pointer flex-col gap-1 rounded-lg border bg-raised p-4",
            chosen === pl.id ? "border-ink shadow-card" : "border-line hover:border-line-input")}>
            <span className="flex items-center gap-2">
              <input type="radio" name="plan" value={pl.id} checked={chosen === pl.id} onChange={() => setChosen(pl.id)} />
              <span className="font-semibold text-ink">{pl.name}</span>
            </span>
            <span className="font-display text-xl text-ink">{formatBRL(pl.priceCents)}<span className="text-sm text-muted">/mês</span></span>
            <span className="text-sm text-muted">{pl.storageGb} GB de fotos · {pl.blurb}</span>
          </label>
        ))}
      </fieldset>
      <Field label="CPF ou CNPJ" name="cpfCnpj" inputMode="numeric" autoComplete="off" className="max-w-xs"
        hint="Para a cobrança e a nota. Você paga por PIX, boleto ou cartão na página do Asaas." />
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" size="lg" loading={pending} className="self-start">Assinar</Button>
    </form>
  );
}

export function CancelButton() {
  const [state, action, pending] = useActionState<PlanState, FormData>(cancel, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <Button type="submit" variant="secondary" loading={pending} className="self-start">Cancelar assinatura</Button>
      <p className="text-xs text-muted">Um clique, sem multa. Você continua criando galerias até o fim do mês já pago, e as galerias existentes seguem no ar.</p>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}

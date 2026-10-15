import type { Metadata } from "next";
import { requirePhotographer } from "@/lib/auth";
import { PLANS, planById } from "@/lib/billing/plans";
import { data } from "@/lib/data";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { CancelButton, PlanPicker } from "./PlanForms";

export const metadata: Metadata = { title: "Plano" };

export default async function PlanoPage({ searchParams }: { searchParams: Promise<{ cancelado?: string; aguardando?: string }> }) {
  const p = await requirePhotographer();
  const sub = await data.getSubscription(p.id);
  const { cancelado, aguardando } = await searchParams;
  const daysLeft = Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 864e5);
  const plan = planById(sub.plan);
  const line =
    sub.status === "active" ? `Plano ${plan?.name ?? sub.plan} ativo${sub.currentPeriodEnd ? ` até ${formatDate(sub.currentPeriodEnd)}` : ""}.` :
    sub.status === "past_due" ? "Pagamento atrasado. Pague a fatura no Asaas para continuar criando galerias." :
    sub.status === "canceled" ? "Assinatura cancelada." :
    daysLeft > 0 ? `Teste grátis: ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"} restantes.` : "Seu teste grátis acabou.";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl text-ink">Plano</h1>
      <p role="status" className="rounded-lg border border-line bg-raised p-4 text-ink">{line}</p>
      {cancelado && <p className="text-sm text-muted">Cancelado. Obrigado por ter usado.</p>}
      {aguardando && <p className="text-sm text-muted">Assinatura criada. Assim que o pagamento for confirmado, o plano aparece como ativo.</p>}
      {env.billing === "off" && (
        <p className="rounded-md bg-surface p-3 text-sm text-muted">Pagamentos ainda não configurados (variáveis do Asaas ausentes).</p>
      )}
      {sub.status === "active" || sub.status === "past_due" ? <CancelButton /> : <PlanPicker plans={PLANS} current={sub.plan === "trial" ? null : sub.plan} />}
    </div>
  );
}

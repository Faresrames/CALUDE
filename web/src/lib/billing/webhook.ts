// Aplica um evento de webhook do Asaas na assinatura. Idempotente: cada evento uma vez só.
// O status mora no nosso banco, atualizado só por aqui; a tela nunca confia no navegador.
import { data, type Subscription } from "../data";
import { PLANS } from "./plans";

export type AsaasEvent = {
  id?: string;
  event: string;
  payment?: { id: string; subscription?: string | null; dueDate?: string; status?: string; value?: number };
  subscription?: { id: string };
};

/** Fim do período pago: vencimento + 1 mês, ou + 12 meses se o valor for de plano anual. */
const periodEnd = (day: string, yearly: boolean) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + (yearly ? 12 : 1));
  return d.toISOString();
};

export async function applyAsaasEvent(e: AsaasEvent): Promise<"applied" | "duplicate" | "ignored"> {
  const subId = e.payment?.subscription ?? e.subscription?.id ?? null;
  const eventId = e.id ?? `${e.event}:${e.payment?.id ?? e.subscription?.id ?? "?"}`;
  if (!(await data.recordWebhookEvent("asaas", eventId, e.event))) return "duplicate";
  if (!subId) return "ignored"; // cobrança avulsa: não é nossa assinatura

  let patch: Partial<Pick<Subscription, "status" | "currentPeriodEnd">> | null = null;
  switch (e.event) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED":
      patch = {
        status: "active",
        currentPeriodEnd: e.payment?.dueDate
          ? periodEnd(e.payment.dueDate, PLANS.some((p) => Math.round((e.payment?.value ?? 0) * 100) === p.yearlyCents))
          : null,
      };
      break;
    case "PAYMENT_OVERDUE":
      patch = { status: "past_due" };
      break;
    case "SUBSCRIPTION_DELETED":
    case "SUBSCRIPTION_INACTIVATED":
      patch = { status: "canceled" };
      break;
  }
  if (!patch) return "ignored";
  return (await data.updateSubscriptionByProvider(subId, patch)) ? "applied" : "ignored";
}

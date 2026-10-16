"use server";
import { redirect } from "next/navigation";
import { requirePhotographer } from "@/lib/auth";
import { asaas } from "@/lib/billing/asaas";
import { planById } from "@/lib/billing/plans";
import { data } from "@/lib/data";
import { env } from "@/lib/env";

export type PlanState = { error?: string };

export async function subscribe(_prev: PlanState, form: FormData): Promise<PlanState> {
  const p = await requirePhotographer();
  if (env.billing !== "asaas") return { error: "Pagamentos ainda não configurados (Asaas)." };
  const plan = planById(String(form.get("plan")));
  const cycle = form.get("cycle") === "yearly" ? "yearly" : "monthly";
  const doc = String(form.get("cpfCnpj") ?? "").replace(/\D/g, "");
  if (!plan) return { error: "Escolha um plano." };
  if (doc.length !== 11 && doc.length !== 14) return { error: "Informe um CPF ou CNPJ válido para a nota." };
  const sub = await data.getSubscription(p.id);
  if (sub.status === "active" && sub.providerSubscriptionId) return { error: "Você já tem um plano ativo. Cancele antes de trocar." };
  let invoice: string | null;
  try {
    const customerId = sub.providerCustomerId ?? (await asaas.createCustomer({ name: p.businessName ?? p.name, email: p.email, cpfCnpj: doc, externalReference: p.id })).id;
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    const s = await asaas.createSubscription({
      customer: customerId, valueCents: cycle === "yearly" ? plan.yearlyCents : plan.monthlyCents, cycle,
      description: `Farol ${plan.name} (${cycle === "yearly" ? "anual" : "mensal"})`, externalReference: p.id, nextDueDate: today,
    });
    await data.linkSubscription(p.id, plan.id, customerId, s.id);
    invoice = await asaas.firstInvoiceUrl(s.id);
  } catch (e) {
    return { error: `O Asaas recusou: ${(e as Error).message}` };
  }
  redirect(invoice ?? "/gerenciador/plano?aguardando=1");
}

export async function cancel(): Promise<PlanState> {
  const p = await requirePhotographer();
  const sub = await data.getSubscription(p.id);
  if (!sub.providerSubscriptionId) return { error: "Nenhuma assinatura para cancelar." };
  try {
    await asaas.cancelSubscription(sub.providerSubscriptionId);
  } catch (e) {
    return { error: `Não deu para cancelar agora: ${(e as Error).message}` };
  }
  await data.updateSubscriptionByProvider(sub.providerSubscriptionId, { status: "canceled" });
  redirect("/gerenciador/plano?cancelado=1");
}

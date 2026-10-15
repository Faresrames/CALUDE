// Cliente da API oficial do Asaas (v3). Sandbox até o /replica-deploy.
// Docs: https://docs.asaas.com
const base = () => (process.env.ASAAS_ENV === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3");

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: { access_token: process.env.ASAAS_API_KEY!, "content-type": "application/json", "user-agent": "selecao-fotos" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as T & { errors?: { description: string }[] };
  if (!res.ok) throw new Error(json.errors?.map((e) => e.description).join("; ") || `Asaas ${res.status}`);
  return json;
}

export const asaas = {
  createCustomer: (c: { name: string; email: string; cpfCnpj: string; externalReference: string }) =>
    call<{ id: string }>("POST", "/customers", { ...c, notificationDisabled: false }),

  /** billingType UNDEFINED: o fotógrafo escolhe PIX, boleto ou cartão na fatura do Asaas. */
  createSubscription: (s: { customer: string; valueCents: number; description: string; externalReference: string; nextDueDate: string }) =>
    call<{ id: string }>("POST", "/subscriptions", {
      customer: s.customer, billingType: "UNDEFINED", cycle: "MONTHLY", value: s.valueCents / 100,
      nextDueDate: s.nextDueDate, description: s.description, externalReference: s.externalReference,
    }),

  firstInvoiceUrl: async (subscriptionId: string) => {
    const r = await call<{ data: { invoiceUrl: string }[] }>("GET", `/subscriptions/${subscriptionId}/payments`);
    return r.data[0]?.invoiceUrl ?? null;
  },

  cancelSubscription: (subscriptionId: string) => call<{ deleted: boolean }>("DELETE", `/subscriptions/${subscriptionId}`),
};

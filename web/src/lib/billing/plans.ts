// Planos do SaaS. PREÇOS PROVISÓRIOS: o /replica-launch define os valores finais
// (comparando com o público do original e as reclamações de preço).
import type { Plan } from "../data";

export type PlanInfo = { id: Exclude<Plan, "trial">; name: string; priceCents: number; storageGb: number; blurb: string };

export const PLANS: PlanInfo[] = [
  { id: "starter", name: "Começo", priceCents: 3990, storageGb: 50, blurb: "Para quem faz alguns eventos por mês." },
  { id: "pro", name: "Profissional", priceCents: 6990, storageGb: 200, blurb: "Temporada cheia de casamentos." },
  { id: "studio", name: "Estúdio", priceCents: 11990, storageGb: 600, blurb: "Equipe e muitos eventos ao mesmo tempo." },
];

export const planById = (id: string) => PLANS.find((p) => p.id === id) ?? null;
export const TRIAL_DAYS = 14;

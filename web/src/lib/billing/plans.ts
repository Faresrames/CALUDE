// Planos do Farol: preço fixo por mês, sem créditos, limite por fotos ativas (galerias não arquivadas).
// Base: preços públicos da categoria lidos em 2026-10-16 (replica/launch/pricing.md).
import type { Plan } from "../data";

export type Cycle = "monthly" | "yearly";
export type PlanInfo = {
  id: Exclude<Plan, "trial">;
  name: string;
  forWho: string;
  photos: number;
  monthlyCents: number;
  yearlyCents: number; // 10x o mensal: 2 meses grátis
};

export const PLANS: PlanInfo[] = [
  { id: "starter", name: "Começo", forWho: "Para quem faz alguns eventos por mês", photos: 5_000, monthlyCents: 2900, yearlyCents: 29000 },
  { id: "pro", name: "Temporada", forWho: "Para quem tem casamento todo fim de semana", photos: 30_000, monthlyCents: 5900, yearlyCents: 59000 },
  { id: "studio", name: "Estúdio", forWho: "Para equipes e estúdios com muitos eventos", photos: 100_000, monthlyCents: 10900, yearlyCents: 109000 },
];

export const TRIAL_DAYS = 14;
/** No teste grátis vale o limite do plano Temporada. */
export const TRIAL_PHOTOS = 30_000;

export const planById = (id: string) => PLANS.find((p) => p.id === id) ?? null;
export const photoLimit = (plan: Plan) => (plan === "trial" ? TRIAL_PHOTOS : planById(plan)?.photos ?? TRIAL_PHOTOS);

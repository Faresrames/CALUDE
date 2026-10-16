// Qual implementação de cada serviço está ativa. Real quando as variáveis existem;
// local (disco, caixa de saída em arquivo, login de demonstração) quando não existem.
// Em produção, tudo tem que ser real, a não ser com DEMO_MODE=1.
const has = (...k: string[]) => k.every((x) => !!process.env[x]);

export const env = {
  get appUrl() {
    // APP_URL tem que existir no BUILD (páginas estáticas usam no og:image); na Vercel, cai no domínio de produção dela
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null;
    return (process.env.APP_URL ?? vercel ?? "http://localhost:3000").replace(/\/$/, "");
  },
  get auth(): "supabase" | "demo" {
    return has("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY") ? "supabase" : "demo";
  },
  get storage(): "r2" | "disk" {
    return has("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET") ? "r2" : "disk";
  },
  get mail(): "resend" | "outbox" {
    return has("RESEND_API_KEY", "MAIL_FROM") ? "resend" : "outbox";
  },
  get billing(): "asaas" | "off" {
    return has("ASAAS_API_KEY", "ASAAS_WEBHOOK_TOKEN") ? "asaas" : "off";
  },
};

/** Chamado no início das rotas que dependem de serviço real em produção. */
export function assertProductionReady() {
  if (process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "1") return;
  const missing = [
    env.auth === "demo" && "Supabase (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    env.storage === "disk" && "R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET)",
    env.mail === "outbox" && "Resend (RESEND_API_KEY, MAIL_FROM)",
    !process.env.SESSION_SECRET && "SESSION_SECRET",
    !process.env.CRON_SECRET && "CRON_SECRET",
  ].filter(Boolean);
  if (missing.length) throw new Error(`Configuração de produção incompleta: ${missing.join("; ")}`);
}

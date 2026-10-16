// Checagem de produção do Farol (rode antes de cada deploy e no build da Vercel).
// Falha (exit 1) se faltar variável obrigatória ou se as páginas legais ainda tiverem campos [ENTRE COLCHETES].
const required = {
  "Postgres (Supabase)": ["DATABASE_URL"],
  "Login (Supabase Auth)": ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  "Fotos (Cloudflare R2)": ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"],
  "E-mail (Resend)": ["RESEND_API_KEY", "MAIL_FROM"],
  "Cobrança (Asaas)": ["ASAAS_API_KEY", "ASAAS_WEBHOOK_TOKEN", "ASAAS_ENV"],
  "Segredos": ["SESSION_SECRET", "CRON_SECRET", "APP_URL"],
  "Páginas legais": ["NEXT_PUBLIC_LEGAL_NAME", "NEXT_PUBLIC_CNPJ", "NEXT_PUBLIC_SUPPORT_EMAIL"],
};
const problems = [];
for (const [what, keys] of Object.entries(required)) {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) problems.push(`${what}: falta ${missing.join(", ")}`);
}
const app = process.env.APP_URL ?? "";
if (app && !app.startsWith("https://")) problems.push(`APP_URL precisa ser https:// (está "${app}")`);
if (process.env.DEMO_MODE === "1") problems.push("DEMO_MODE=1 em produção: o login de demonstração ficaria aberto");
if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) problems.push("SESSION_SECRET curto demais (use openssl rand -base64 32)");
if (process.env.ASAAS_ENV && process.env.ASAAS_ENV !== "production") problems.push(`ASAAS_ENV=${process.env.ASAAS_ENV}: cobrança em modo de teste`);

if (problems.length) {
  console.error(`✗ Não está pronto para produção (${problems.length}):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("✓ Variáveis de produção completas");

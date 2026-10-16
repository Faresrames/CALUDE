# Checklist de deploy: Farol

Data: 2026-10-16  Branch: `claude/cool-goldberg-6wnj5g`  **Liberação do usuário: ainda não** (bloqueado, ver abaixo)

## Checagem (código) — tudo passou

- [x] testes no navegador: **42/42** (+1 da imagem social: 6/6 em `lancamento.spec.ts` depois da correção)
- [x] testes de dados: **23/23**
- [x] nenhum bug S1 ou S2 aberto (`replica/bugs.md`)
- [x] paridade: essenciais **14/14**, nota **91,1**
- [x] varredura da marca limpa (`sweep.py` exit 0) + nenhum "Select" nos textos
- [x] anúncio das lojas: 0 erros, 0 avisos (rascunho; hoje o Farol é só web)
- [x] build de produção passa
- [x] privacidade e termos no ar, com todos os fornecedores (Supabase, Cloudflare, Vercel, Resend, Asaas) — **rascunhos para advogado**
- [x] apagar conta funciona (teste C-H1)
- [x] favicon provisório, títulos e imagem social (provisória) são nossos; e-mails com a paleta do Farol
- [ ] **logo final** (briefing em `replica/brand.md`)
- [~] auditoria: 0 crítica; 1 alta no `postcss` embutido no Next 15 (só no build; some no Next 16) e 1 moderada

Corrigido nesta etapa: a imagem social apontava para `localhost:3000` (prévia quebrada no WhatsApp). Agora usa `APP_URL`
(ou o domínio de produção da Vercel); `APP_URL` precisa existir no build e o `preflight` exige.

## Produção — falta tudo o que é seu (`npm run preflight` → 7 bloqueios)

- [ ] Supabase: projeto **de produção** separado, backups (plano Pro ou `pg_dump` agendado), `DATABASE_URL` (pooler 6543) e `MIGRATION_DATABASE_URL` (direta 5432)
- [ ] Supabase Auth: URL do site e `APP_URL/auth/callback` nos redirecionamentos; Google OAuth com o domínio de produção (escopos básicos: sem verificação demorada)
- [ ] Cloudflare R2: bucket privado, token, CORS com o domínio de produção
- [ ] Resend: domínio verificado (SPF, DKIM, DMARC)
- [ ] Asaas: **conta de produção**, `ASAAS_ENV=production`, webhook `APP_URL/api/webhooks/asaas` com token; 1 cobrança real e estorno
- [ ] `SESSION_SECRET`, `CRON_SECRET` (`openssl rand -base64 32`), `APP_URL=https://seu-dominio`
- [ ] `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_CNPJ`, `NEXT_PUBLIC_SUPPORT_EMAIL`

## Hospedagem e domínio (Vercel)

- Importar o repositório na Vercel com **Root Directory = `web`**. O build roda `vercel-build`:
  `preflight` (bloqueia se faltar variável) → migrações → `next build`. Crons em `web/vercel.json` (09h e 18h de Brasília).
- Depois de comprar o domínio (registro.br ou outro), na Vercel → Domains, criar o que ela mostrar:

| registro | nome | valor |
| --- | --- | --- |
| A | @ | IP que a Vercel mostrar |
| CNAME | www | `cname.vercel-dns.com` |
| TXT | (se pedir) | verificação da Vercel |
| SPF/DKIM | (o que o Resend mostrar) | — |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:voce@seudominio` (depois `quarantine`) |

- Endereço principal: o domínio sem www; `www` redireciona. HTTPS automático (conferir).

## Acompanhar

- [ ] erros: Sentry (grátis) · [ ] uptime: página `/` e uma galeria de teste (Better Stack ou UptimeRobot), alerta no celular
- [ ] analytics sem cookie de publicidade (Plausible ou Umami)
- [ ] fazer o fluxo inteiro no site no ar: no computador e no seu celular
- Primeira semana: e-mails chegando fora do spam, webhooks do Asaas (status da assinatura muda), tempo de envio com fotos reais, erros no Sentry.

**Nada vai ao ar sem o seu "pode ir".** Eu não compro domínio, não crio conta e não colo chave real.

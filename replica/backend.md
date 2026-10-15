# Backend

Stack: Postgres (Supabase) · Supabase Auth · Cloudflare R2 · Resend · Asaas · Vercel Cron.
Código em `web/`. Sem as variáveis de um serviço, o app usa a versão local
(disco, caixa de saída em `web/.data/outbox.jsonl`, login de demonstração) — só em desenvolvimento;
em produção isso é erro, a não ser com `DEMO_MODE=1`.

## O que você precisa criar (contas e chaves são suas; eu não crio nem digito nenhuma)

Coloque tudo em `web/.env.local` (modelo: `web/.env.example`) e, no deploy, nas variáveis da Vercel.

1. **Supabase** (supabase.com, plano grátis serve para começar)
   - Novo projeto, região São Paulo.
   - Project Settings → Database → Connection string → **Transaction pooler** (porta 6543) → `DATABASE_URL`.
   - Project Settings → API → `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` (esta nunca vai para o navegador).
   - Authentication → URL Configuration: Site URL = seu `APP_URL`; Redirect URLs: `APP_URL/auth/callback`.
   - Authentication → Providers → Email: ligado (link mágico). Para os e-mails de login saírem do seu domínio, configure o SMTP do Resend em Authentication → SMTP.
   - Rodar as migrações: `cd web && DATABASE_URL=... npm run db:migrate`.
   - Backups: o plano grátis não tem backup diário; o Pro tem. **Antes de ter clientes pagantes, suba para o Pro ou faça `pg_dump` agendado.**
2. **Login com Google** (opcional, recomendado)
   - Google Cloud Console → APIs e serviços → Tela de consentimento OAuth (escopos só `openid`, `email`, `profile`: **não precisa da verificação demorada do Google**, que é só para escopos sensíveis).
   - Credenciais → ID do cliente OAuth (Aplicativo da Web) → URI de redirecionamento: `https://<seu-projeto>.supabase.co/auth/v1/callback`.
   - Cole o Client ID e o Secret em Supabase → Authentication → Providers → Google.
3. **Cloudflare R2**
   - R2 → Create bucket (privado) → `R2_BUCKET`. Conta → `R2_ACCOUNT_ID`.
   - Manage API tokens → token com "Object Read & Write" só nesse bucket → `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
   - Bucket → Settings → **CORS policy** (o navegador envia direto para o R2):
     ```json
     [{ "AllowedOrigins": ["https://SEU-DOMINIO"], "AllowedMethods": ["GET", "PUT"], "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
     ```
4. **Resend**
   - Adicione seu domínio e crie no seu DNS os registros que ele mostrar (SPF, DKIM) + DMARC `v=DMARC1; p=none; rua=mailto:voce@seudominio`.
   - API Keys → `RESEND_API_KEY`. `MAIL_FROM="Seu Estúdio <galerias@seudominio.com.br>"`.
5. **Asaas** (comece no **sandbox**: sandbox.asaas.com)
   - Integrações → Chave de API → `ASAAS_API_KEY`; deixe `ASAAS_ENV=sandbox`.
   - Integrações → Webhooks → URL `APP_URL/api/webhooks/asaas`, defina um token de autenticação e use o mesmo em `ASAAS_WEBHOOK_TOKEN`.
     Eventos: cobranças (PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE) e assinaturas (SUBSCRIPTION_DELETED, SUBSCRIPTION_INACTIVATED).
   - Teste com o cartão/PIX de teste do sandbox. `ASAAS_ENV=production` só no /replica-deploy.
6. **Segredos seus**: `SESSION_SECRET` e `CRON_SECRET` (`openssl rand -base64 32`).
7. **Vercel Cron**: `web/vercel.json` agenda `/api/cron/run` às 09h e 18h de Brasília. A Vercel manda
   `Authorization: Bearer $CRON_SECRET` sozinha. **No plano Hobby, cron só roda 1x por dia** (fica só a das 09h); no Pro, as duas.

## Como as partes funcionam

| parte | como | arquivo |
| --- | --- | --- |
| dados | Postgres direto (pooler), autorização por `photographer_id` em toda consulta + RLS como segunda trava; regras da seleção no trigger | `src/lib/data/postgres.ts`, `db/migrations/0001_init.sql` |
| login | Supabase Auth: link mágico e Google; sessão em cookie httpOnly renovada no middleware; "Sair" encerra em todos os aparelhos | `src/lib/auth/`, `src/middleware.ts`, `src/app/auth/callback` |
| conta | apagar conta apaga dados (cascade), arquivos do R2 e o usuário do Supabase | `src/app/gerenciador/configuracoes/actions.ts` |
| fotos | navegador reduz e põe marca d'água; envia direto ao R2 por URL assinada (15 min); visualização por URL assinada (1 h) | `src/lib/storage/` |
| e-mail | Resend; cada aviso no máximo 1x/dia por pessoa; falha fica em `notifications.error` e pode ser tentada de novo | `src/lib/mail/`, `src/lib/notify.ts` |
| jobs | `/api/cron/run`: vence galerias e avisa o fotógrafo, lembra o cliente (3 dias antes / sem abrir há 5 dias / último dia), expira PIX parado há 72h | `src/app/api/cron/run` |
| extras | PIX estático (BR Code do Banco Central) com a chave do fotógrafo; ele confirma o recebimento; o cliente recebe e-mail | `src/lib/pix.ts`, `S15`, `OrderPanel` |
| assinatura | Asaas: cliente + assinatura mensal (PIX, boleto ou cartão na fatura deles); webhook idempotente atualiza o status; cancelamento em 1 clique; teste de 14 dias; cancelado vale até o fim do mês pago | `src/lib/billing/` |

Planos com **preço provisório** (R$ 39,90 / 69,90 / 119,90): o /replica-launch define os valores.

## Testes

- `npm test` (com `TEST_DATABASE_URL` de um banco descartável): 16 testes — PIX contra o exemplo oficial do Banco Central;
  isolamento entre fotógrafos (código e RLS); pacote cheio com cliques simultâneos; extras e pedido; prazo vencido;
  lembretes sem duplicar e com nova tentativa após falha; webhook repetido; plano vencido e cancelado; apagar conta.
- Ponta a ponta no navegador (build de produção + Postgres): ciclo completo, senha e limite de tentativas,
  PIX com QR e CRC conferido, confirmação de pagamento, cron com e sem token, e-mails na caixa de saída,
  plano vencido bloqueando galeria nova, apagar conta.

**Não testado (precisa das suas contas):** Supabase Auth de verdade (link mágico, Google, callback), upload/visualização
no R2 (CORS e URLs assinadas reais), envio pelo Resend, API e webhooks reais do Asaas sandbox. O código segue as APIs
oficiais, mas o primeiro teste com as chaves vai mostrar ajustes. Faça na ordem: Supabase → R2 → Resend → Asaas.

## Checklist de segurança

- [x] segredos só em variáveis de ambiente; `.env*` no `.gitignore` (menos `.env.example`); nada no bundle do navegador (só `NEXT_PUBLIC_*`, que são públicas por natureza)
- [x] entrada validada no servidor (zod) em toda rota com corpo; formulários validados nas server actions
- [x] autorização em toda leitura e escrita; testado com um segundo fotógrafo (código e RLS)
- [x] limites: senha da galeria 5/min, pedido de link de login 5/10 min por IP, comentários 30/min por galeria; o Supabase limita os e-mails de login
  - limite em memória: com várias instâncias na Vercel vale por instância. **Antes de escalar, trocar por Upstash Redis.**
- [x] webhooks verificam o token (comparação em tempo constante); cron exige `CRON_SECRET`
- [~] uploads: tipo e tamanho limitados no servidor local; **no R2 a URL assinada não limita o tamanho** (precisaria de POST policy). Mitigação: só fotógrafo logado recebe URL, por 15 min, na pasta da própria galeria; bytes somados em `storage_used_bytes` para cota por plano
- [x] arquivos servidos de outro domínio (R2), bucket privado, URLs que expiram
- [x] sem dados pessoais em URLs (o e-mail saiu da URL do login) nem em logs (logs só têm ids e mensagem de erro)
- [~] dependências auditadas: 0 crítica. Sobra 1 alta no `postcss` embutido no Next 15 (só processa o nosso CSS no build; corrige com Next 16, migração para o /replica-deploy) e 1 moderada
- [ ] política de privacidade listando Supabase, Cloudflare, Vercel, Resend e Asaas — escrever no /replica-launch, antes do deploy

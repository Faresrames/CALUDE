# Bugs

Build testado: `claude/cool-goldberg-6wnj5g` (antes de c15883b). Chromium 140 (Playwright 1.56), 1440px e 390px.
Todos reproduzidos por um teste que falhava; corrigidos em **c15883b**; o mesmo teste passa depois.

Por severidade: S1 0 · S2 0 · S3 5 · S4 1 — todos corrigidos.

### BUG-001: sessão expirada no meio do envio não diz para entrar de novo

- Severity: S3
- Flow / case: F01 / F01-E6
- Screen: S04
- Build: antes de c15883b  Browser / device: Chromium 140, 1440px

Steps
1. Entrar, criar uma galeria, ficar na tela "Subir fotos".
2. A sessão expira (no teste: apagar os cookies).
3. Arrastar fotos.

Expected: aviso claro de que a sessão expirou e é preciso entrar de novo; nada registrado.
Actual: cada foto mostrava só "Servidor recusou"; o fotógrafo não sabia o que fazer.
Evidence: `e2e/f01-galeria.spec.ts` › F01-E6
Suspected cause: o envio tratava 401 igual a qualquer erro.
Status: fixed in c15883b (para a fila, marca "Sessão expirou: entre de novo" e mostra aviso)

### BUG-002: título com palavra longa estoura a largura no celular

- Severity: S3
- Flow / case: F01 / F01-E2
- Screen: S04
- Build: antes de c15883b  Browser / device: Chromium 140, 390px

Steps
1. Criar galeria com título de 120 caracteres sem espaço no fim ("Casamento 💍 Conceição & João — xxxx…").
2. Abrir "Subir fotos" no celular.

Expected: o título quebra; nada de rolagem lateral.
Actual: página com 689px de largura numa tela de 390px.
Evidence: `e2e/f01-galeria.spec.ts` › F01-E2 (scrollWidth 689)
Suspected cause: o link do caminho ("Galerias / título") não quebrava palavra.
Status: fixed in c15883b (`overflow-wrap: anywhere` em títulos e caminhos)

### BUG-003: prazo mostrado ao cliente sem fuso horário

- Severity: S3
- Flow / case: F02 / F02-E10
- Screen: S12 e e-mails
- Build: antes de c15883b  Browser / device: Chromium 140, fuso America/Manaus

Steps
1. Galeria com prazo; cliente abre o link com o celular em Manaus (1h a menos).

Expected: "Prazo: 17/10, 23:59 (horário de Brasília)".
Actual: "Prazo: 17/10, 23:59." O cliente entende 23:59 de Manaus e perde a última hora.
Evidence: `e2e/f02-selecao.spec.ts` › F02-E10
Status: fixed in c15883b (`formatDeadline` na galeria e nos e-mails de convite e lembrete)

### BUG-004: CSV quebra quando o nome do arquivo tem vírgula

- Severity: S3
- Flow / case: F04 / F04-E1
- Screen: S06 (exportação)
- Build: antes de c15883b  Browser / device: Chromium 140, 1440px

Steps
1. Subir "Noiva, véu (1).jpg"; cliente escolhe; baixar o CSV.

Expected: `"Noiva, véu (1)",nao` (uma coluna só).
Actual: `Noiva, véu (1),nao` — a planilha abre com 3 colunas. A lista para o Lightroom também separa o nome em dois.
Evidence: `e2e/f04-lightroom.spec.ts` › F04-E1; `test/csv.test.mts`
Status: fixed in c15883b (aspas no CSV conforme RFC 4180; aviso na lista do Lightroom listando os nomes com vírgula)

### BUG-005: nome de arquivo começando com "=" vira fórmula no Excel

- Severity: S3 (só o próprio fotógrafo controla os nomes e baixa o CSV, então o risco é contra ele mesmo)
- Flow / case: F04 / F04-E2
- Screen: S06 (exportação)

Steps
1. Subir "=1+1.jpg"; cliente escolhe; baixar o CSV e abrir no Excel.

Expected: célula com o texto `=1+1`.
Actual: célula `=1+1` interpretada como fórmula (injeção de fórmula em CSV).
Evidence: `e2e/f04-lightroom.spec.ts` › F04-E2; `test/csv.test.mts`
Status: fixed in c15883b (apóstrofo antes de = + - @, recomendação OWASP)

### BUG-006: ordem dos títulos pula de h1 para h3

- Severity: S4
- Flow / case: F01 / A11Y
- Screen: S02 (vazio e com galerias)

Steps
1. Abrir o gerenciador e rodar o axe.

Expected: zero violações.
Actual: `heading-order` — o cartão da galeria e o "nenhuma galeria" usavam h3 logo abaixo do h1; quem navega por títulos no leitor de tela pula um nível.
Evidence: `e2e/f01-galeria.spec.ts` › F01-H1 (axe)
Status: fixed in c15883b (h2)

## Erros do próprio teste (não são bugs do app)

- F01-E9: o teste contava 1 Tab no campo de data, mas o Chrome dá 3 paradas (dia, mês, ano). Teste corrigido para andar com Tab até o campo pelo rótulo.

## Para conferir (não reproduzido)

- 2026-10-16: F03-E2 (reabrir e reenviar) estourou o tempo de 60 s uma vez, numa rodada lenta da suíte (2,5 min contra 1,5 min
  normal). Não reproduziu em 16 execuções seguidas do arquivo nem em 1 rodada completa (37/37). O registro da falha se perdeu
  nas rodadas seguintes. Se voltar: guardar o trace (`test-results/`) e olhar se o "Reabrir" demora a refletir no painel.

- Safari antigo (anterior ao 16.4) não tem OffscreenCanvas no worker: o envio falharia. Conferir no iPhone/Mac do fotógrafo (M-6).
- Com várias instâncias na Vercel, o limite de tentativas de senha vale por instância (memória). Trocar por Upstash antes de escalar.
- No R2, a URL de envio não limita o tamanho do arquivo (ver `replica/backend.md`).
- Dois disparos simultâneos do cron depois de uma falha de e-mail podem reenviar o mesmo aviso uma vez a mais. Improvável (cron 1–2x por dia).
- O filtro "Contém" do Lightroom com nomes separados por vírgula: comportamento não verificado num Lightroom real (M-5).

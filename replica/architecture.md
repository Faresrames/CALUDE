# Arquitetura: (nome a definir em /replica-brand), um rebuild das funções do Select/EPICS

Base: `replica/recon.md` v0 (só fontes públicas; telas inferidas).
Data: 2026-10-15

## Stack

| camada | escolha | por quê |
| --- | --- | --- |
| web | Next.js (App Router) + TypeScript | um app só para painel do fotógrafo, galeria do cliente e landing |
| estilo | Tailwind + tokens de /replica-design | padrão do pack |
| banco | Postgres no Supabase | RLS por fotógrafo, auth incluso, plano grátis para começar |
| ORM | Drizzle | SQL explícito, migrations versionadas |
| auth | Supabase Auth (e-mail + Google) | só o fotógrafo tem conta; o cliente entra por link |
| arquivos | **Cloudflare R2** | **sem custo de saída de dados**: galeria de casamento é muita foto vista muitas vezes; banda é o maior custo do produto |
| fotos | **prévias geradas no navegador do fotógrafo** (Web Worker + OffscreenCanvas): 1600px com marca d'água e 400px de miniatura, enviadas direto ao R2 por URL assinada | para selecionar ninguém precisa do original: upload ~15x menor, sem servidor de imagem, e a marca d'água já sai "queimada" na foto |
| cobrança dos extras (cliente → fotógrafo) | v1: **PIX estático** (BR Code do Banco Central com a chave do próprio fotógrafo, valor já preenchido) + fotógrafo confirma o recebimento. v2: conta Mercado Pago do fotógrafo conectada (OAuth) para confirmação automática | o dinheiro vai direto para o fotógrafo; a plataforma não intermedia pagamento (sem risco regulatório no começo) |
| assinatura do SaaS (fotógrafo → você) | **Asaas** (PIX, cartão e boleto recorrentes) | Stripe cobra PIX, mas assinatura recorrente brasileira com PIX/boleto é mais simples no Asaas. **Decisão para confirmar** |
| e-mail | Resend, do seu domínio | avisos de galeria, lembretes, seleção enviada |
| jobs | Vercel Cron (2x por dia) | lembretes de prazo e vencimento de galerias; nada pesado roda no servidor |
| hospedagem | Vercel | deploy por branch, preview por PR |

Um banco, um app. Nada de app de desktop nem plugin de Lightroom na v1:
a exportação em texto (S06) cobre o "organizar no Lightroom".

## Schema

Tabelas: 13. Acesso: **RLS** para tudo que é do fotógrafo; o **cliente final
não tem conta** e só fala com o banco por rotas do servidor (service role)
que conferem `access_token` + cookie da senha em **toda** chamada.

Arquivo: `replica/schema.sql` (validado em Postgres 16, com testes de
pacote cheio, galeria travada e isolamento entre fotógrafos).

| tabela | o quê |
| --- | --- |
| photographers | o tenant: dados, marca d'água, chave PIX, uso de storage |
| subscriptions | plano, teste de 14 dias, status no Asaas |
| clients | clientes do fotógrafo |
| galleries | pacote, preço da extra, prazo, senha, token do link, status |
| photos | nome original (para o Lightroom), pasta/momento, chaves R2, favorita do fotógrafo |
| selections | uma linha por foto marcada/favoritada; única por (galeria, foto) |
| comments | na foto ou num ponto (x,y) da lâmina do álbum |
| orders | extras: quantidade × preço, PIX copia-e-cola, status |
| albums, album_versions, album_spreads | aprovação de álbum com versões |
| notifications | log de e-mails/WhatsApp; no máximo 1 do mesmo tipo por dia |

Regras que ficam **no banco**, não na tela:
- foto não seleciona em galeria enviada, vencida ou entregue (`gallery_locked`, `gallery_expired`);
- sem extras liberados, não passa do pacote (`package_full`), com `select ... for update` na galeria contra dois cliques simultâneos (noivos em dois celulares);
- só um pedido de extras aberto por galeria;
- nome de arquivo único por galeria (senão a exportação para o Lightroom fica ambígua).

## API

Fotógrafo (logado, RLS):

| método rota | faz | quem | entrada | saída | fluxo |
| --- | --- | --- | --- | --- | --- |
| GET `/gerenciador` | lista galerias com status e contagem | fotógrafo | filtro, busca | galerias | F01 |
| POST `/api/galleries` | cria galeria | fotógrafo | cliente, título, data, pacote, preço extra, prazo, senha | galeria | F01 |
| POST `/api/galleries/:id/uploads` | gera URLs assinadas do R2 (lote de até 50) | fotógrafo | nomes, tamanhos | URLs PUT | F01 |
| POST `/api/galleries/:id/photos` | registra fotos já enviadas | fotógrafo | basename, chaves, dimensões, pasta | fotos | F01 |
| PATCH `/api/galleries/:id` | edita prazo, pacote, senha, status | fotógrafo | campos | galeria | F01, F05 |
| POST `/api/galleries/:id/send` | marca como enviada e manda e-mail ao cliente | fotógrafo | — | ok | F01 |
| POST `/api/galleries/:id/reopen` | destrava para o cliente mudar a seleção | fotógrafo | novo prazo | galeria | F02 |
| GET `/api/galleries/:id/export` | lista para o Lightroom (`IMG_1 IMG_2 …`) e CSV | fotógrafo | formato | texto/CSV | F04 |
| PATCH `/api/photos/:id` | marca favorita sugerida | fotógrafo | photographer_pick | foto | — |
| POST `/api/orders/:id/confirm` | confirma PIX recebido | fotógrafo | — | pedido pago | F03 |
| POST `/api/albums` · `/api/albums/:id/versions` | cria álbum e nova versão com lâminas | fotógrafo | imagens | versão | F06 |
| POST `/api/galleries/:id/deliver` | sobe finais e libera download | fotógrafo | chaves | galeria entregue | F07 |
| GET/PATCH `/api/me` | perfil, marca d'água, chave PIX | fotógrafo | campos | perfil | — |

Cliente (sem conta; token no link + cookie assinado após a senha):

| método rota | faz | quem | entrada | saída | fluxo |
| --- | --- | --- | --- | --- | --- |
| GET `/g/:token` | abre a galeria (pede senha se houver) | cliente | senha | página | F02 |
| POST `/api/g/:token/unlock` | confere senha, grava cookie httpOnly | cliente | senha | ok | F02 |
| GET `/api/g/:token/photos` | fotos com URLs assinadas de 1h + estado da seleção | cliente | pasta, filtro | lista | F02 |
| PUT `/api/g/:token/selections/:photoId` | marca/desmarca/favorita (salva na hora) | cliente | selected, favorited | contador | F02 |
| POST `/api/g/:token/comments` | comenta foto ou lâmina | cliente | texto, foto/lâmina, x, y | comentário | F02, F06 |
| POST `/api/g/:token/submit` | finaliza: trava galeria, cria pedido se houver extras | cliente | — | resumo + PIX | F02, F03 |
| GET `/api/g/:token/album` · POST `…/album/decision` | vê versão atual, aprova ou pede ajuste | cliente | decisão | versão | F06 |
| GET `/api/g/:token/download` | zip dos finais (gerado em stream) | cliente | — | zip | F07 |

Webhooks de entrada: Asaas (assinatura paga/atrasada/cancelada); v2 Mercado
Pago (pagamento de extras). Webhooks de saída: nenhum na v1.

Jobs (Vercel Cron, 09h e 18h de Brasília):
- `reminders`: galerias `sent`/`in_progress` com prazo em 3 dias, 1 dia ou sem abrir há 5 dias → e-mail (e WhatsApp na v2);
- `expire`: prazo vencido → `expired` e aviso ao fotógrafo;
- `orders-expire`: PIX pendente há mais de 48h → `expired`;
- `storage-cleanup` (diário): apaga do R2 galerias arquivadas há mais de 90 dias e contas apagadas.

Só APIs oficiais e públicas, com as chaves do próprio usuário. Nada dos
endpoints internos do Select.

## The parts that bite

- **fuso horário**: prazo é "até 23:59 do dia X em Brasília". Guardar em UTC, mostrar sempre no fuso do fotógrafo (`America/Sao_Paulo`; o Brasil não tem mais horário de verão, mas não assumir isso no código).
- **idempotência**: webhooks do Asaas chegam repetidos → guardar o id do evento; `submit` clicado duas vezes não pode criar dois pedidos (índice único de pedido aberto).
- **corrida**: os noivos selecionando ao mesmo tempo em dois celulares → trava da linha da galeria no trigger; a tela mostra o contador que volta do servidor, não o calculado no celular.
- **tamanho de arquivo**: o fotógrafo arrasta 2.000 JPEGs de 20 MB. Redimensionar no navegador em fila de 4 workers; retomar se a aba fechar (lista do que já subiu vem do servidor); recusar RAW na v1 com mensagem clara.
- **banda e custo**: prévia de 1600px com qualidade ~80 fica em ~300 KB; 1.000 fotos ≈ 300 MB por galeria. R2 sem custo de saída; limite de storage por plano.
- **"anti-cópia"**: no navegador não existe. Marca d'água queimada, prévia pequena, sem botão direito. Não prometer mais que isso na venda.
- **links**: o token é o acesso. 24 caracteres aleatórios, senha opcional, rate limit no `unlock` (5 tentativas/min por IP).
- **e-mail**: SPF, DKIM e DMARC no domínio, senão o link da galeria cai no spam do cliente.
- **multi-tenant**: RLS em tudo e teste com um segundo fotógrafo (feito no schema).
- **LGPD**: apagar conta apaga fotos no R2 (job) e dados no banco (cascade). Política de privacidade lista Supabase, Cloudflare, Vercel, Resend e Asaas.
- **realtime**: não precisa. O painel atualiza ao abrir e o fotógrafo recebe e-mail quando a seleção chega.
- **offline**: não. Se cair a conexão no meio da seleção, cada clique já foi salvo.

## Build order

1. **Fatia vertical** (feia, mas de ponta a ponta)
   telas S01, S02, S03, S04, S12, S14, S06 · tabelas photographers, galleries, photos, selections · rotas `POST /api/galleries`, `uploads`, `photos`, `GET /g/:token`, `PUT selections`, `submit`, `export`.
   Prova: criar galeria, subir 20 fotos, abrir o link no celular, escolher 10, finalizar, copiar a lista e filtrar no Lightroom.

2. **Essenciais** (os 13 "must" de `features.csv`)
   senha do link (S11, `unlock`), marca d'água no upload (S08), prazo + trava (`expire`), contador do pacote, painel com status (S02), clientes (S07, tabela clients), aviso ao fotógrafo quando o cliente finaliza.

3. **Importantes**
   favoritar e comentar (S13, comments) → extras + PIX (S15, orders) → lembretes (`reminders`, notifications) → aprovação de álbum (S09, S17, tabelas de álbum) → assinatura e teste de 14 dias (S10, subscriptions, Asaas).
   Depois os opcionais: pastas por momento, favoritas do fotógrafo, entrega final (S18), idiomas, WhatsApp.

4. **Correções da /replica-entrepreneur** (quando ela rodar).
   Candidatas pelas reclamações já vistas contra a concorrência: estabilidade e status público, "o cliente não consegue selecionar" (testar celulares fracos), cobrança clara e sem surpresa, suporte rápido.

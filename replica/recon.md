# Recon map: Select by EPICS (web, responsivo)

Escopo: seleção de fotos online, o ciclo principal (fotógrafo cria galeria →
cliente seleciona dentro do pacote + compra extras → fotógrafo recebe a
seleção), mais aprovação de álbum e entrega final.
Para: uso no próprio negócio de fotografia (casamentos) **e** vender como
SaaS para outros fotógrafos.
Data: 2026-10-15
Status: **rascunho v0**. Feito só com fontes públicas lidas pela busca. O app
(`app.select.pics/gerenciador`) exige login e não foi aberto. Telas marcadas
"inferida" precisam ser confirmadas com prints da conta do próprio usuário,
salvos em `replica/screens/`.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | página do produto (EPICS) | https://www.epics.com.br/select-sistema-de-selecao-e-prova-de-fotos-albuns-online | lista oficial de funções; página com data antiga |
| 2 | página do produto (espelho) | https://www.epics.pro/select-sistema-de-selecao-e-prova-de-fotos-albuns-online | mesmo conteúdo |
| 3 | login do app | https://app.select.pics/ | login em PT, EN e ES |
| 4 | concorrente: Selpics | https://www.selpics.com/selecao-de-fotos | favoritas do fotógrafo, pastas por momento, lembretes |
| 5 | concorrente: 46graus (ajuda) | https://help.46graus.com/pt-BR/articles/8922610-galeria-de-selecao-aprovacoes | prazo trava a seleção; marca d'água antes do upload; arquivo para filtrar no Lightroom |
| 6 | concorrente: Seleto Foto | https://seletofoto.com.br/ | plugin Lightroom Classic |
| 7 | concorrente: FotoApp | https://fotoapp.com.br/ | extras cobrados por PIX ou cartão automaticamente |
| 8 | concorrente: By'Fotos | https://byfotos.com.br/ | R$ 19,90/mês no plano inicial, 7 dias grátis |
| 9 | concorrente: eSelect | https://digifotoonline.com.br/ | extras em vários tamanhos e preços |
| 10 | guia da categoria | https://blog.fotto.com.br/selecao-de-fotos/ | galerias privadas (login) e públicas |
| 11 | Alboom (blog) | https://blog.alboompro.com/aprovacao-de-fotos-online/ | alertas de inatividade, entrega até 4K, integração Lightroom |
| 12 | conta do usuário | https://app.select.pics/gerenciador | **pendente: prints** |

Não foram encontrados: central de ajuda pública, página de preços atual,
changelog nem API pública do Select.

## Core loop

O fotógrafo envia as fotos de um evento, o cliente escolhe as fotos do pacote
pelo celular (e paga pelas extras) e o fotógrafo recebe a lista pronta para
tratar no Lightroom.

## Screens

Todas as telas abaixo são **inferidas** das funções públicas [1][4][5][7].
Rotas e estados ainda não foram vistos no app.

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Login / cadastro do fotógrafo | `/` [3] | entrar, criar conta, trocar idioma | form, seletor de idioma | inferida |
| S02 | Gerenciador (painel) | `/gerenciador` | lista de galerias e status de cada seleção | tabela/cards, filtro, busca, badge de status | inferida |
| S03 | Nova galeria | botão em S02 | cliente, título, data do evento, fotos no pacote, preço da extra, prazo, senha, marca d'água | form, date picker, toggle | inferida |
| S04 | Upload | após S03 | enviar centenas a milhares de fotos [1] | dropzone, barra de progresso por arquivo | inferida |
| S05 | Detalhe da galeria | clique em S02 | acompanhar a seleção, ver comentários, reenviar link, mudar prazo | grade de fotos, contador, lista de comentários | inferida |
| S06 | Exportar seleção | ação em S05 | lista de nomes de arquivo para filtrar no Lightroom [5][6] | botão copiar/baixar | inferida |
| S07 | Clientes | menu | cadastro de clientes e galerias de cada um | tabela | inferida |
| S08 | Configurações | menu | marca d'água, logo, e-mails, lembretes, dados de pagamento | form, upload de logo | inferida |
| S09 | Aprovação de álbum (fotógrafo) | menu ou S05 | enviar lâminas do álbum, ver comentários e versões [1] | lista de versões, visualizador de lâmina | inferida |
| S10 | Plano / assinatura | menu | plano atual, teste de 14 dias [1] | cards de plano | inferida |
| S11 | Acesso do cliente | link enviado | abrir galeria com senha [10] | form de senha | inferida |
| S12 | Galeria do cliente | após S11 | grade de fotos, marcar, contador "X de Y" | grade, contador fixo, filtros (todas/selecionadas/favoritas) | inferida |
| S13 | Foto ampliada | clique em S12 | ver grande, selecionar, favoritar, comentar [1] | lightbox, setas, botão selecionar, campo de comentário | inferida |
| S14 | Revisar e finalizar | botão em S12 | conferir escolhas, ver extras e valor, enviar | lista, total, confirmação | inferida |
| S15 | Pagamento de extras | após S14 se houver extras | PIX ou cartão [7] | QR PIX, form de cartão | inferida |
| S16 | Seleção enviada | após S14/S15 | confirmação, galeria travada | mensagem | inferida |
| S17 | Aprovação de álbum (cliente) | link | comentar no layout e aprovar [1] | visualizador de lâminas, comentários fixados | inferida |
| S18 | Entrega final | link | baixar fotos tratadas | grade, baixar tudo (zip) | inferida |

## Flows

```
F01 Fotógrafo cria e envia uma galeria
    S02 -> S03 -> S04 -> S05 (copiar link / enviar e-mail)
    happy path clicks: a medir
    edge: upload interrompido, arquivo repetido, foto não JPEG, marca d'água
          ativada depois do upload [5]

F02 Cliente faz a seleção (ciclo principal)
    S11 -> S12 -> S13 (seleciona/favorita/comenta) -> S14 -> S16
    happy path clicks: a medir
    edge: passou do limite do pacote, prazo vencido (trava) [5], duas pessoas
          (noivos) selecionando ao mesmo tempo, celular com conexão ruim,
          voltou depois e a seleção precisa estar salva

F03 Cliente compra fotos extras
    S14 -> S15 -> S16
    edge: PIX expirado, cartão recusado, pagamento confirmado depois que a
          galeria travou

F04 Fotógrafo recebe a seleção e trata no Lightroom
    e-mail/aviso -> S05 -> S06 -> Lightroom
    edge: nomes de arquivo repetidos entre câmeras

F05 Lembrete de prazo
    tarefa agendada -> e-mail/WhatsApp ao cliente que não terminou [1][4]

F06 Aprovação de álbum
    S09 (envia versão) -> S17 (cliente comenta/aprova) -> S09 (nova versão)

F07 Entrega final
    S05 -> envia fotos tratadas -> S18 (cliente baixa)
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost, danger | default, hover, focus, disabled, loading | todas |
| Photo tile | normal, selecionada, favorita, com comentário | default, hover, selected, loading (blur), erro | S05, S12, S18 |
| Selection counter | dentro do pacote, com extras | normal, no limite, acima do limite | S12, S13, S14 |
| Lightbox | foto, lâmina de álbum | loading, navegação, comentário aberto | S13, S17 |
| Dropzone / upload list | — | vazio, enviando, erro, concluído | S04, S09 |
| Status badge | não aberta, em andamento, enviada, vencida, paga | — | S02, S05 |
| Date picker | — | — | S03, S05 |
| Gallery card/row | — | vazio, filled | S02, S07 |
| Comment thread | na foto, no álbum | — | S05, S13, S17 |
| PIX QR | — | aguardando, pago, expirado | S15 |
| Toast | sucesso, erro | — | todas |

## Inferred data model

```
Photographer  id, name, email, logo, watermark_settings, plan, trial_ends_at, locale
              evidence: [1] marca d'água personalizada, teste de 14 dias; [3] idiomas
              confidence: medium

Client        id, photographer_id, name, email, phone
              evidence: [1] prazo por cliente
              confidence: medium

Gallery       id, photographer_id, client_id, title, event_date, package_size,
              extra_price_cents, deadline_at, password_hash, watermark_on,
              status (draft | sent | in_progress | submitted | expired | delivered)
              evidence: [1][5][7]
              confidence: medium

Photo         id, gallery_id, filename, storage_key, width, height, position,
              folder (momento)
              evidence: [1] upload em massa; [4] pastas por momento
              confidence: medium

Selection     id, gallery_id, photo_id, kind (package | extra), favorited, created_at
              evidence: [1] escolhe e favorita; [7] extras
              confidence: medium

Comment       id, gallery_id, photo_id?, album_spread_id?, author (client | photographer), text
              evidence: [1] comentários na galeria e no layout do álbum
              confidence: medium

Order         id, gallery_id, extras_count, amount_cents, method (pix | card),
              status, provider_ref
              evidence: [7]
              confidence: guess (não confirmado no Select)

Album         id, gallery_id, client_id
AlbumVersion  id, album_id, number, status (pending | changes | approved)
AlbumSpread   id, version_id, position, image_key
              evidence: [1] "cada aprovação gera uma versão com registro das alterações"
              confidence: medium

Reminder      id, gallery_id, send_at, channel, sent_at
              evidence: [1][4]
              confidence: guess
```

Relationships: Photographer 1-n Client, Client 1-n Gallery, Gallery 1-n Photo,
Gallery 1-n Selection, Gallery 1-n Order, Gallery 0-1 Album, Album 1-n
AlbumVersion, AlbumVersion 1-n AlbumSpread.

## Feature matrix

See `features.csv`. Must: 13, should: 12, could: 6, skip: 3.

## Out of scope (cannot or should not be cloned)

- A marca, o nome "Select", o domínio e os textos da EPICS.
- A base de fotógrafos e clientes da EPICS e os sites para fotógrafos (outro
  produto da EPICS, fora deste escopo).
- O "anti-cópia" do jeito que o original faz: no navegador ninguém impede um
  print de tela. Dá para dificultar (marca d'água, imagem pequena, bloquear
  botão direito), sem prometer mais que isso.

## Size

Telas 18, fluxos 7, entidades 11.
Partes difíceis:
1. **Upload e armazenamento** de milhares de fotos por galeria: miniaturas,
   marca d'água aplicada no servidor, custo de storage e de banda.
2. **Pagamento por PIX** no Brasil (Mercado Pago, Asaas ou Stripe com PIX),
   mais a assinatura dos fotógrafos, se for vender como SaaS.
3. **Organização automática no computador / Lightroom** [1][6]: precisa de um
   app de desktop ou plugin de Lightroom, que é outro projeto.

Tamanho: **M** (algumas semanas) para o ciclo principal (F01–F05).
**L** com aprovação de álbum, entrega final e o SaaS completo (planos,
cobrança dos fotógrafos). Plugin de Lightroom e app desktop fora da primeira
versão.

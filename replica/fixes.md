# O que os usuários odeiam, e o que fazer com isso

Data: 2026-10-16 · Planilha: `replica/reviews.csv` · Ranking: `replica/feedback.md` (`reviews.py` com `replica/themes-pt.json`)

## Amostra (leia antes de tudo)

- **14 itens**, de **2 fontes** (13 do Reclame Aqui, 1 do Threads), sobre **5 empresas** da categoria:
  Select/EPICS (1), Selpics/YouFocus (6), Picsize (2), Alboom (4) e 1 post que cita Alboom → 46graus → Picsize.
- **O texto de cada linha é o título da reclamação, copiado exato.** O texto completo e as notas não puderam ser
  lidos: este ambiente não abre o Reclame Aqui nem a central do Select. Os resumos da busca **não** foram usados como citação.
- **Do próprio Select há só 1 reclamação.** O perfil da EPICS no Reclame Aqui não tem reputação calculada (menos de 10
  avaliadas) e aponta como categorias principais "Problemas com o Site" e "Não consigo cancelar"
  ([perfil](https://www.reclameaqui.com.br/empresa/epics-com-br/)). O resto é da categoria (concorrentes diretos).
- Não existem avaliações em App Store, Google Play, G2, Capterra ou Reddit para esses produtos.

**Conclusão honesta: dá direção, não dá ranking.** Todos os temas, menos um, são "finos" (menos de 3 itens ou uma fonte só).

## 1. O que eles odeiam

| # | problema | itens | fontes | citações |
| --- | --- | --- | --- | --- |
| 1 | **A galeria não abre, sai do ar, não carrega** | 6 (4 empresas) | 1 | "[Youfocus (selpics) não abre](https://www.reclameaqui.com.br/youfocus/youfocus-selpics-nao-abre__LCopngRpl1AHTK5/)" · "[Indisponibilidade da plataforma Picsize e falta de suporte causam prejuízos a fotógrafa](https://www.reclameaqui.com.br/picsize/indisponibilidade-da-plataforma-picsize-e-falta-de-suporte-causam-prejuizos-a-fotografa_TeYf696Y2AQvzYIh/)" |
| 2 | **O cliente não consegue escolher** | 3 · fino | 1 | "[O cliente não consegue selecionar as fotos](https://www.reclameaqui.com.br/selpics/o-cliente-nao-consegue-selecionar-as-fotos_AIyPiTBdLogH2zCm/)" · "[Sistema de escolha e compra das fotos não funciona!](https://www.reclameaqui.com.br/alboom_181430/sistema-de-escolha-e-compra-das-fotos-nao-funciona_Vdp-kh2oO_AoL1N-/)" |
| 3 | **Cobrança sem serviço (créditos, sistema bloqueado)** | 3 · fino | 1 | "[Cobrança sem com sistema da select bloqueado](https://www.reclameaqui.com.br/epics-com-br/cobranca-sem-com-sistema-da-select-bloqueado_CblBykvVNSJItPUw/)" (Select) · "[Créditos descontados, mas fotos não carregadas no Selpics](https://www.reclameaqui.com.br/youfocus/creditos-descontados-mas-fotos-nao-carregadas-no-selpics_XXEa2hsUjKljRTko/)" |
| 4 | **Foto paga não chega / envio falha** | 2 · fino | 1 | "[Fotos pagas e não entregues pela Fotto/Alboom](https://www.reclameaqui.com.br/alboom_181430/fotos-pagas-e-nao-entregues-pela-fotto-alboom_l8pOFbrYCjKg0p5p/)" · "[Péssima qualidade e problemas com envio de fotos](https://www.reclameaqui.com.br/picsize/pessima-qualidade-e-problemas-com-envio-de-fotos_-5SER_pWmGClLkDl/)" |
| 5 | **Suporte que não responde** | 2 · fino | 1 | "[Desorganização de arquivos, suporte ineficiente e descaso com o cliente na plataforma Alboom.](https://www.reclameaqui.com.br/alboom_181430/desorganizacao-de-arquivos-suporte-ineficiente-e-descaso-com-o-cliente-na-plataforma-alboom_hmj2MfsJv_H-YlL9/)" |

## 2. O que falta (pedido pelo nome)

Nenhum pedido de funcionalidade apareceu nos títulos (o único "pedido" que a ferramenta achou era "falta de suporte",
falso positivo). **Sem dado.** Para ter: ler as reclamações inteiras no navegador, perguntar em grupos de fotógrafos,
ou entrevistar 5 fotógrafos que usam o Select.

## 3. O que ninguém resolve (vira posicionamento)

| problema | evidência |
| --- | --- |
| **Fotógrafo pula de plataforma em plataforma** e nenhuma passa confiança | 3 itens, 2 fontes: "[Não contratem Selpics / Youfocus! PÉSSIMA PLATAFORMA PARA FOTÓGRAFOS](https://www.reclameaqui.com.br/youfocus/nao-contratem-selpics-youfocus-pessima-plataforma-para-fotografos_eMiBN1sF2WGT8jhp/)" · "[São tantos pontos a reclamar](https://www.reclameaqui.com.br/alboom_181430/sao-tantos-pontos-a-reclamar_EYf-EfS5IhENBDB9/)" · "[Já utilizei Alboom, depois fui para a 46 graus e hoje utilizo a Picsize](https://www.threads.com/@allanelly/post/DJrlR1mN2x3/j%C3%A1-utilizei-alboom-depois-fui-para-a-46-graus-e-hoje-utilizo-a-picsize-httpsalla)" |
| **A falha cai no colo do fotógrafo na frente do cliente** (o noivo não consegue escolher e reclama com ele) | junta os temas 1, 2 e 4: 9 dos 14 itens |

## Plano de correções (evidência × custo)

Cada uma entrou em `replica/features.csv` com `original = no`.

| # | o que fazer | tam. | quem faz | evidência | já temos |
| --- | --- | --- | --- | --- | --- |
| 1 | **Página de status pública + monitor que roda o fluxo do cliente a cada 5 min** (abre um link de teste, marca uma foto, confere) e avisa você antes do seu cliente | M | /replica-deploy | tema 1: 6 itens, 4 empresas | os testes de ponta a ponta já existem; é rodá-los em produção |
| 2 | **Seleção que não se perde sem internet**: os toques ficam numa fila e são reenviados quando a conexão volta | P | /replica-build | temas 1 e 2 | hoje desfaz e avisa (F02-E3) |
| 3 | **Cobrança fixa, sem créditos, com aviso antes de cada cobrança e histórico de faturas** | P | /replica-launch + /replica-backend | tema 3: 3 itens, inclui o Select | plano mensal fixo e cancelamento em 1 clique já existem |
| 4 | **Entrega automática das fotos pagas** (cliente pagou as extras → o link de download libera sozinho) | M | /replica-build | tema 4 | depende da entrega final (S18); hoje o fotógrafo confirma o PIX à mão |
| 5 | **Suporte com prazo visível** ("respondemos em até 4 h úteis") e botão de contato no painel | P | /replica-build + processo seu | tema 5 (fino) | — |
| 6 | **Sem prisão: exportar tudo e importar clientes** | P–M | /replica-build | troca de plataforma | CSV da seleção já existe |

Preço e cobrança (item 3) vão para o `/replica-launch`.

## O ângulo

**A — Confiança no dia que importa (recomendado)**
```
Para fotógrafos de casamento que já viram o cliente travar na hora de escolher as fotos,
[seu app] é a seleção que abre no celular de qualquer noivo, com status público e aviso antes do problema chegar ao cliente.
Evidência: "não abre / fora do ar / não consegue selecionar", 9 de 14 itens, 4 empresas (1 fonte: Reclame Aqui).
```

**B — Cobrança sem pegadinha**
```
Para fotógrafos que já pagaram crédito ou mensalidade sem conseguir usar o sistema,
[seu app] cobra um valor fixo por mês, avisa antes de cada cobrança e cancela em um clique.
Evidência: "cobrança / créditos / sistema bloqueado", 3 de 14 itens, inclui 1 do Select (fino).
```

**C — Sem prisão**
```
Para fotógrafos que já trocaram de plataforma duas ou três vezes,
[seu app] importa seus clientes e deixa você levar tudo embora quando quiser.
Evidência: "troca de plataforma", 3 de 14 itens, 2 fontes (fino).
```

**Recomendo A**, com B como prova de apoio. É o tema com mais evidência, toca na dor mais cara (cliente frustrado =
fotógrafo com a reputação em jogo) e o app já tem base para provar: 37 testes de ponta a ponta do fluxo do cliente,
celular sem rolagem lateral, seleção salva a cada toque. Falta tornar isso **visível** (itens 1, 2 e 5).

Regras para a marca e o lançamento:
- Não usar "Select", "EPICS" nem o nome de concorrentes no nome do app, anúncios ou loja.
- As reclamações acima são **pesquisa, não depoimento**: nada delas vai para a landing page.
- Página de comparação com concorrentes citando nomes: pergunte a um advogado antes.

## Para ter um ranking de verdade

Ler no navegador (como pessoa, sem robô) as reclamações completas e as listas no Reclame Aqui de EPICS, YouFocus,
Picsize e Alboom; perguntar em grupos de fotógrafos de casamento ("o que te irrita no seu sistema de seleção?");
e conversar com 5 fotógrafos que usam o Select. Com 50+ itens de 3+ fontes, rodar de novo:
`python3 .claude/skills/replica-entrepreneur/reviews.py replica/reviews.csv --themes replica/themes-pt.json --out replica/feedback.md`

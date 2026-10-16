# Preços do Farol

Lido em **2026-10-16**, pela busca (as páginas dos sites não abrem deste ambiente). Preços mudam e algumas fontes
são antigas: conferir nos sites antes de anunciar comparação.

## A categoria

| produto | modelo | entrada | topo | anual | teste | fonte |
| --- | --- | --- | --- | --- | --- | --- |
| Select (EPICS) | fotos ativas, 6 planos | R$ 19/mês (2 mil fotos) | R$ 190/mês (140 mil) | -13% (semestral -10%) | 14 dias, sem cartão | [blog EPICS: venda de fotos](https://www.epics.com.br/blog/venda-de-fotos-saiba-tudo-sobre-a-nova-solucao-da-epics) · termos: valores "podem ser alterados sem necessidade de aviso prévio" ([termos](https://www.epics.com.br/termos)) |
| Picsize Gallery Pro | espaço (GB) | R$ 37,90 (20 GB) | R$ 147,90 (300 GB) | -20% | 14 dias | [planos](https://picsize.com.br/planos-gallerypro) |
| Alboom Proof | fotos ativas | grátis (500) · R$ 29 (2 mil) | R$ 149 (100 mil, página antiga) | varia por campanha | plano grátis | [assine Proof](https://lp.alboompro.com/assine-proof) |
| By'Fotos | — | R$ 19,90/mês | — | — | 7 dias | [byfotos.com.br](https://byfotos.com.br/) |
| Selpics/YouFocus | créditos | — | — | — | — | reclamações citam créditos descontados ([1](https://www.reclameaqui.com.br/youfocus/creditos-descontados-mas-fotos-nao-carregadas-no-selpics_XXEa2hsUjKljRTko/)) |

## O que as reclamações dizem sobre cobrança (de `replica/feedback.md`)

3 de 14 itens, tema fino: "Cobrança sem com sistema da select bloqueado" (Select), "Créditos descontados, mas fotos não
carregadas no Selpics", "…gerando cobrança indevida de créditos". O perfil da EPICS no Reclame Aqui tem "Não consigo cancelar"
entre as categorias principais.

## O modelo

- **Teste:** 14 dias, sem cartão, com o limite do Temporada (30 mil fotos). É o padrão da categoria; não dá para fazer menos.
- **Fixo, sem créditos, sem taxa por foto.** Responde direto ao tema de cobrança.
- **Limite por fotos ativas** (galerias não arquivadas), como Select e Alboom: o fotógrafo entende e o custo nosso acompanha
  (prévia + miniatura ≈ 340 KB; 100 mil fotos ≈ 34 GB no R2 ≈ US$ 0,51/mês, sem custo de saída).
- **Mensal e anual** (anual = 10 meses, 2 grátis ≈ -17%: no meio entre Select -13% e Picsize -20%).
- **3 planos, nomeados por quem usa:**

| plano | para quem | fotos ativas | mensal | anual |
| --- | --- | --- | --- | --- |
| Começo | alguns eventos por mês | 5.000 | **R$ 29** | R$ 290 |
| Temporada | casamento todo fim de semana | 30.000 | **R$ 59** | R$ 590 |
| Estúdio | equipes e muitos eventos | 100.000 | **R$ 109** | R$ 1.090 |

Por que esses números: a entrada fica acima dos R$ 19 do Select, mas com 2,5× mais fotos (5 mil contra 2 mil) e sem
crédito; o Temporada (o plano para quem fotografa casamento de verdade) fica abaixo do Picsize Plus (R$ 57,90 por 100 GB ≈
mesma faixa) com tudo incluso. **Não competimos no menor preço**: o argumento é "não falha e não cobra surpresa".
Plano grátis (como o Alboom) **não**: custo de suporte sem receita; o teste de 14 dias cumpre esse papel.

## Correções de cobrança no produto

- [x] cancelar em 1 clique, sem multa, vale até o fim do período pago (S10)
- [x] sem créditos, sem cobrança por foto
- [x] fatura antes de cada cobrança: o Asaas manda por e-mail (`notificationDisabled: false`)
- [x] uso de fotos visível (S10) e aviso claro ao passar do limite, antes do envio
- [ ] histórico de faturas dentro do Farol (hoje: e-mails do Asaas)
- [ ] aviso por e-mail 7 dias antes da renovação anual

## O que você cria no Asaas

Nada de catálogo: o Farol cria a assinatura pela API com o valor do plano e o ciclo (`MONTHLY` ou `YEARLY`). Você só
precisa da conta, da chave de API e do webhook (ver `replica/backend.md`). Para mudar preços: `web/src/lib/billing/plans.ts`.

# Paridade: seu app × Select (EPICS)

Data: 2026-10-16 · Build: `claude/cool-goldberg-6wnj5g` · Ferramenta: `.claude/skills/replica-diff/parity.py`

## Veredito: **lançável** (todas as essenciais prontas, nota 80+, sem S1/S2)

| medida | nota |
| --- | --- |
| **Funcionalidades** | **90,4 / 100** (30 contadas; essenciais **13 de 13**) |
| Funcionalidades, se o Select não tiver as 6 "unknown" | 98,3 / 100 (24 contadas) |
| Layout por tela | **não medido**: não há prints do Select (`replica/screens/` vazio) |
| Bugs abertos | nenhum (6 S3/S4 corrigidos no /replica-test) |
| Testes | 37 no navegador + 21 de dados, todos passando |

Histórico: 82,4 (12/13) em 2026-10-15 → 90,4 (13/13) depois da marca d'água com logo e da aprovação de álbum.

As linhas com original "unknown" (cartão, PIX, entrega final, pastas por momento, WhatsApp, galeria pública)
contam **como se o Select tivesse**: 90,4 é a nota conservadora.

"Lançável" na régua da skill não é "pronto para cliente pagante": ainda faltam a marca própria
(/replica-brand), a política de privacidade e o teste com as suas contas reais (`replica/backend.md`).

## Por área (mais fraca primeiro)

| área | nota | itens |
| --- | --- | --- |
| vendas | 66,7 | 3 (falta cartão) |
| conta | 75 | 2 (falta idiomas) |
| entrega | 75 | 2 (falta entrega final) |
| notificações | 80 | 3 (falta WhatsApp) |
| acesso | 83,3 | 3 (falta galeria pública) |
| galerias | 96,2 | 5 (pastas no envio, parcial) |
| seleção, gerenciador, álbum, cliente, saas | 100 | 12 |

## O que falta, na ordem de construir

1. ~~Marca d'água personalizada~~ — **feito** (logo PNG ou texto, opacidade, posição, prévia; testado pixel a pixel).
2. ~~Aprovação de álbum~~ — **feito** (S09 + S17, pinos na lâmina, versões, e-mails).
3. **[importante] Pagamento das extras por cartão.** Não confirmado no Select. Exige intermediador
   (Mercado Pago com a conta do fotógrafo conectada). **M.** Confirmar se vale antes.
4. **[opcional] Entrega final em alta** (S18; `photos.final_key` existe). **M.**
5. **[opcional] Pastas por momento no envio.** **P.**

Depois: idiomas EN/ES, lembrete por WhatsApp (API oficial), galeria pública com cadastro.

## Fora de propósito (não pontuado)

- Organização automática no computador (exige app de desktop; a lista para o Lightroom cobre a v1).
- Sites para fotógrafos (outro produto da EPICS).

## A mais que o original (não pontuado)

- Favoritas sugeridas pelo fotógrafo (etiqueta "Sugestão"; falta o botão de marcar).
- Prazo com fuso escrito, CSV seguro, aviso de nome com vírgula para o Lightroom.

## Layout

Sem prints do Select, o `imgdiff.py` não tem com o que comparar. Os prints do seu app estão em
`replica/clone-screens/` (S01–S18, 1440 e 390px). Se um dia quiser a nota de layout: mande prints do Select nas
mesmas larguras e no mesmo estado, que eu rodo. Não é bloqueio: a skill diz para não buscar paridade de visual
(é a "cara" do Select, e a sua marca muda tudo isso no /replica-brand).

## Comportamento

Não deu para percorrer o Select (login fechado, sem prints). O que se sabe das fontes públicas, comparado:

| fluxo | Select (fonte pública) | seu app | manter ou mudar |
| --- | --- | --- | --- |
| F02 cliente escolhe | escolhe, favorita, comenta (EPICS) | igual; salva a cada toque; funciona sem login | manter |
| F02 cliques (cliente) | não medido | abrir link + 1 toque por foto + "Revisar e enviar" + "Enviar" = **n + 3** | manter; medir no Select se possível |
| F01 cliques (fotógrafo) | não medido | Nova galeria → formulário → Criar → arrastar → Continuar → Liberar → Copiar link = **6 cliques** + digitação | manter |
| F04 organização | separa as fotos sozinho no computador (app) | lista para colar no Lightroom + CSV | mudar depois (plugin/app), se os usuários pedirem |
| F05 prazo | notificações para controlar o prazo (EPICS) | e-mail 3 dias antes, no último dia, se não abriu em 5 dias; avisa você quando vence | manter; WhatsApp depois |
| F06 álbum | comentários no layout e versões | comentário num ponto ou na lâmina toda, versões com recado, aprovar/pedir ajustes, e-mails | manter |
| extras | não confirmado | PIX direto para você, com QR | manter (diferencial: o dinheiro não passa pela plataforma) |

## Os próximos

1. `/replica-entrepreneur`: ler o que os usuários do Select e dos concorrentes reclamam e virar diferencial.
2. Decidir sobre cartão nas extras (Mercado Pago).
3. Entrega final em alta (S18).
4. Escolher pasta/momento no envio.
5. Idiomas e WhatsApp, se o público pedir.

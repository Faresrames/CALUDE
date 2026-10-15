# Paridade: seu app × Select (EPICS)

Data: 2026-10-15 · Build: `claude/cool-goldberg-6wnj5g` (c15883b + docs) · Ferramenta: `.claude/skills/replica-diff/parity.py`

## Veredito: **ainda não dá para lançar** (falta 1 essencial)

| medida | nota |
| --- | --- |
| **Funcionalidades** | **82,4 / 100** (30 contadas; essenciais 12 de 13) |
| Funcionalidades, se o Select não tiver as 6 "unknown" | 89,2 / 100 (24 contadas) |
| Layout por tela | **não medido**: não há prints do Select (`replica/screens/` vazio) |
| Bugs abertos | nenhum S1/S2 (6 S3/S4 corrigidos no /replica-test) |

As linhas com original "unknown" (cartão, PIX, entrega final, pastas por momento, WhatsApp, galeria pública)
foram contadas **como se o Select tivesse**: a nota de 82,4 é a conservadora.

Regra da skill: lançável = todas as essenciais prontas + nota 80+ + sem S1/S2 abertos.
Falta só a essencial abaixo; o resto já passa.

## Por área (mais fraca primeiro)

| área | nota | itens |
| --- | --- | --- |
| álbum | 0 | 2 |
| vendas | 66,7 | 3 |
| conta | 75 | 2 |
| entrega | 75 | 2 |
| notificações | 80 | 3 |
| acesso | 83,3 | 3 |
| galerias | 84,6 | 5 |
| seleção, gerenciador, cliente, saas | 100 | 10 |

## O que falta, na ordem de construir

1. **[essencial] Marca d'água personalizada — parcial.** Hoje: texto em diagonal com o nome do estúdio.
   Falta: subir o logo em PNG, opacidade e posição em Configurações (S08), e usar no envio. A coluna `watermark_key` e o
   `watermark_opacity/position` já existem no banco. **Tamanho: P (1–2 dias).**
2. **[importante] Aprovação de álbum** (2 itens: comentários na lâmina + versões). Tabelas prontas (`albums`,
   `album_versions`, `album_spreads`, comentários com x/y); faltam S09 e S17. **Tamanho: M (1 semana).**
3. **[importante] Pagamento das extras por cartão.** Não confirmado no Select. Cartão exige intermediador
   (Mercado Pago com a conta do fotógrafo conectada). **Tamanho: M.** Confirmar se vale antes de fazer.
4. **[opcional] Entrega final em alta** (S18 reservada; `photos.final_key` existe). **Tamanho: M** (zip em stream, custo de banda).
5. **[opcional] Pastas por momento no envio.** O cliente já filtra; falta o fotógrafo escolher a pasta ao subir. **Tamanho: P.**

Depois: idiomas EN/ES, lembrete por WhatsApp (API oficial do WhatsApp Business), galeria pública com cadastro.

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
| F06 álbum | comentários no layout e versões | não construído | construir (item 2) |
| extras | não confirmado | PIX direto para você, com QR | manter (diferencial: o dinheiro não passa pela plataforma) |

## Os 5 próximos

1. Marca d'água com logo PNG, opacidade e posição — destrava o "lançável".
2. Aprovação de álbum (S09 + S17).
3. Decidir sobre cartão nas extras (Mercado Pago) — só se o Select tiver ou seus clientes pedirem.
4. Entrega final em alta (S18).
5. Escolher pasta/momento no envio.

Próximo passo da skill: `/replica-build` para o item 1 (e o 2, se quiser), depois `/replica-entrepreneur`.

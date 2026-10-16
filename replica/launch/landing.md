# Página de vendas (construída em `web/src/app/page.tsx`, rota `/`)

Ângulo (de `replica/fixes.md`): **confiança no dia que importa.** Voz: serena, clara, atenta (`replica/brand.md`).
Regras seguidas: nenhuma prova inventada (sem depoimentos, números de usuários, estrelas ou "confiado por"), nenhuma
citação de reclamação, nenhum nome do original ou de concorrente. Cada recurso citado existe e é testado.

1. **Hero** — "A seleção de fotos que não falha no dia que importa." / "Para fotógrafos de casamento: seu cliente escolhe as
   fotos pelo celular, sem instalar nada. Cada toque fica salvo. Você recebe a lista pronta para o Lightroom." /
   botão "Testar 14 dias grátis" (→ /entrar) · "Sem cartão de crédito." · print real da galeria no celular.
2. **O problema** (faixa azul-noite) — "O pior momento para um sistema falhar é quando o noivo abre o link." Paráfrase dos
   temas 1–3 (não abre, não consegue marcar, cobrança com sistema travado), sem citar ninguém.
3. **Como funciona** — Suba as fotos · Mande o link · Receba a seleção.
4. **O que muda no seu dia** — puxado pelas correções, não pela paridade:
   celular do noivo (temas 1–2) · preço fixo sem créditos (tema 3) · PIX direto · avisa antes (voz "atento") · álbum · sua marca.
   Linha final com o básico (paridade é o preço de entrada).
5. **Preços** — os 3 planos de `plans.ts` (mensal e anual), "Todos os planos têm tudo".
6. **Dúvidas** — instalar app? internet caiu? originais vão para a nuvem? extras? Lightroom? **importar do sistema atual
   (resposta honesta: ainda não)**, cancelar.
7. **Chamada final** — "Sua próxima galeria pode ser a primeira no Farol."

Rodapé: Privacidade · Termos · Entrar. Páginas `/privacidade` e `/termos` são **rascunhos para revisão jurídica**, com
`[RAZÃO SOCIAL]`, `[CNPJ]` e `[E-MAIL DE CONTATO]` a preencher (variáveis `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_CNPJ`,
`NEXT_PUBLIC_SUPPORT_EMAIL`).

Conferido: axe sem violações em `/`, `/privacidade`, `/termos`; sem rolagem lateral a 390 px; contraste dos tokens 30/30.
Cortado na revisão: "botões grandes" (os botões das fotos têm 32 px, abaixo dos 44 px recomendados para toque → melhoria anotada).
Falta: imagem social 1200×630 (do briefing do logo) e o logo final no lugar do texto "Farol" no cabeçalho.

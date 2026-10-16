# Marca: Farol (nome de trabalho)

Data: 2026-10-16 · Ângulo (de `replica/fixes.md`): **confiança no dia que importa** — a seleção que não falha quando o cliente vai escolher.
O nome mora num lugar só: `web/src/lib/brand.ts` (+ `web/src/app/icon.svg`). Trocar é mudar ali.

## 1. Nome

20 ideias → 5 finalistas. Evitado tudo que soe como Select, Selpics, Picsize, Alboom, PhotoSelect, Seleto, PickPhotos, Fotto, YouFocus.

| estilo | ideias |
| --- | --- |
| descritivo | Escolha Certa, Prova Fácil, Galeria Firme, Álbum Aberto |
| composto | Toquefácil, Dia Sim, Diasim |
| inventado | Lumê, Velino, Nerô, Mirá |
| metáfora | **Farol**, Âncora, Laço, Aliança, Véu |
| verbo/palavra | **Visto**, **Escolhida**, **Firmo**, Aprova |

| finalista | ideia | prós | contras | situação |
| --- | --- | --- | --- | --- |
| **Farol** ★ | luz (fotografia) + guia que não apaga (confiança) | curto, fala do ângulo, fácil de soletrar | palavra comum: marca pode ter dono em outras classes | **recomendado** |
| Escolhida | "a foto escolhida" | fala do produto | mais longo; feminino pode soar estranho em frases | reserva |
| Lumê | inventado, de luz | registrável | **parecido com "Lumio"**, plataforma de fotógrafos para clientes ([fonte](https://news.siliconallee.com/?p=9073)) | **cortado** (risco de confusão) |
| Visto | "dar o visto", aprovar | curto | **busca dominada por "foto para visto americano"** | **cortado** |
| Firmo | firme, confiável | curto | **parecido com "FIMO"**, app de câmera ([fonte](https://fueled.com/blog/vintage-camera-app/)) | cortado |

## 2. Checagens (rodadas ou "a rodar" — nunca "disponível" sem checar)

| checagem | onde | Farol | Escolhida |
| --- | --- | --- | --- |
| **marca no Brasil** | INPI, busca.inpi.gov.br, classes 9 e 42 | **a rodar** | a rodar |
| marca EUA / UE / global | tmsearch.uspto.gov · TMview · WIPO Brand DB | a rodar | a rodar |
| domínio | registro.br (`.com.br`), `.app` | **a rodar** (este ambiente não resolve DNS externo) | a rodar |
| App Store e Google Play | buscar o nome exato | a rodar | a rodar |
| perfis | Instagram, TikTok, X, GitHub | a rodar | a rodar |
| web "nome + categoria" | busca "Farol app fotógrafos seleção de fotos galeria" | **rodada 2026-10-16: nenhum app da categoria com o nome** | rodada 2026-10-16: nenhum app da categoria |

São checagens de triagem, **não liberação jurídica**. Antes de gastar dinheiro com o nome (domínio, logo, anúncio),
um advogado de marcas deve fazer a busca no INPI. Sugestões de domínio se `farol.com.br` estiver ocupado:
`usefarol.com.br`, `farolfotos.com.br`, `farol.app`.

## 3. Paleta

| papel | cor | uso |
| --- | --- | --- |
| accent | `#1c2d47` azul-noite | botões principais, links fortes, e-mails |
| accent-hover | `#2a4166` | hover |
| **brand-glow** | `#e9a23b` âmbar | a luz do farol: logo, detalhes sobre fundo escuro. **Nunca texto sobre fundo claro** |
| on-brand-glow | `#1c2d47` | texto sobre âmbar |
| info | `#1f5f7a` (era azul; afastado do azul-noite) | badge "Aguardando cliente" |
| focus | `#2b5fa8` | anel de foco |
| sem mudança | neutros quentes, verde `selected`, vermelho `danger`, rosa `favorite` | fora da família da marca, para não confundir estado com marca |

Contraste: `contrast.py` → **30 pares, 0 falhas AA**.
As cores do Select **não foram vistas** (sem prints): `brand.json` fica com `colors: []`. Quando houver um print,
conferir que o azul-noite não é o mesmo deles e pôr as cores deles no `brand.json`.

## 4. Briefing do logo

- **Ideia:** o feixe de luz do farol que também é o canto de uma moldura de foto — "a luz que guia até a foto escolhida".
- **Tipo:** símbolo + palavra. Palavra "farol" em minúsculas, serifada (família da Fraunces), azul-noite; símbolo: ponto de luz âmbar com feixe em diagonal.
- **Tem que funcionar** a 16 px (favicon: só o símbolo) e como ícone de 1024 px.
- **Entregar:** SVG (símbolo, palavra, juntos; versões clara e escura), ícone 1024×1024 sem transparência (iOS), favicons 16/32/180, imagem social 1200×630.
- **Não pode parecer** o logo do Select/EPICS nem de concorrente: sem forma, par de cores ou truque de letra em comum. Pôr os logos deles ao lado dos rascunhos e comparar.
- **Hoje:** `web/src/app/icon.svg` é um **ícone provisório** (quadrado azul-noite, ponto e feixe âmbar), no lugar do favicon padrão do Next (o triângulo da Vercel), até o logo final.

## 5. Voz

**Sereno** (calmo, não frio) · **Claro** (direto, não seco) · **Atento** (avisa antes, não insiste).

| faça | não faça |
| --- | --- |
| Diga o que aconteceu e o que fazer agora | Culpar quem usa ("você errou", "inválido!") |
| "você", frases curtas, palavras de casa | Jargão: upload, token, sessão, erro 409 |
| Avise antes do problema chegar ao cliente | Assustar com exclamação e caixa alta |
| Fale de fotos e momentos com o cliente final | Falar de "arquivos" e "registros" com o noivo |
| Uma frase para celebrar o que importa | Exagero: "Incrível!!!", emoji em mensagem de erro |

### Os 10 textos mais vistos, reescritos

| # | onde | antes | agora |
| --- | --- | --- | --- |
| 1 | login | Seu painel de galerias e seleções. | Suas galerias e seleções, num lugar só. |
| 2 | painel vazio | Nenhuma galeria ainda / Crie a primeira, suba as fotos do evento e mande o link para o cliente escolher. | Tudo pronto para a primeira galeria / Suba as fotos do evento e mande o link. A gente avisa quando a seleção chegar. |
| 3 | instrução do cliente | Toque no círculo para escolher, no coração para favoritar. Tudo é salvo na hora. | Toque no círculo para escolher e no coração para guardar as favoritas. Cada toque fica salvo: pode parar e voltar quando quiser. |
| 4 | confirmação | Seleção enviada! / O fotógrafo recebeu as suas N fotos… | Seleção enviada / Pronto. O fotógrafo já recebeu as suas N fotos e pode começar o tratamento. |
| 5 | sem internet (foto) | Sem conexão. A foto não foi salva; tente de novo. | A internet caiu e essa foto não foi salva. Toque de novo quando a conexão voltar. |
| 6 | sem internet (enviar) | Sem conexão. Tente de novo. | A internet caiu e a seleção não foi enviada. Tente de novo quando a conexão voltar. |
| 7 | pacote cheio | O pacote está completo. Desmarque uma foto para escolher outra. | Seu pacote já está completo. Para trocar, desmarque uma foto antes. |
| 8 | prazo vencido | O prazo para escolher terminou. Fale com o fotógrafo para estender. | O prazo para escolher terminou. Peça ao fotógrafo mais alguns dias: suas escolhas continuam salvas. |
| 9 | seleção travada | Esta seleção já foi enviada. Fale com o fotógrafo para reabrir. | Esta seleção já foi enviada. Se quiser mudar algo, peça ao fotógrafo para reabrir. |
| 10 | e-mail ao cliente | Assunto: Escolha suas fotos: X | Assunto: Suas fotos chegaram: X · "cada toque fica salvo, pode parar e voltar quando quiser" |

Mais: títulos das abas "Página · Farol"; assinatura discreta "Galeria por Farol" no rodapé das telas do cliente
(a marca do fotógrafo continua em primeiro plano).

## 6. Varredura

```
python3 .claude/skills/replica-brand/sweep.py web --config replica/brand.json
Clean. Nothing of the original's name, domain or colours found.
```

- Lista proibida (`brand.json`): EPICS, EPICS Select, Select 2.0, Selpics, Picsize, Alboom, YouFocus, 46graus, PhotoSelect,
  Seleto Foto + 7 domínios.
- **"Select" sozinho não entra na varredura** (é palavra de código: `<select>`, SQL). Checagem extra:
  `grep -rnw "Select" web/src web/e2e web/db web/scripts` → **nada**.
- Por olho: favicon trocado (era o da Vercel), títulos das abas, e-mails com o azul-noite. Imagem social (OG): ainda não existe → /replica-launch.
- Testes depois da troca: **37/37 no navegador**, tipos e lint limpos.

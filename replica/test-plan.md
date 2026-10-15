# Plano de teste: sistema de seleção de fotos

Build: branch `claude/cool-goldberg-6wnj5g`  Data: 2026-10-15  Ambiente: local, build de produção,
Postgres 16 (`app_e2e`, zerado a cada rodada), storage e e-mail locais, login de demonstração.
Specs em `web/e2e/` (`npm run e2e`). Toda spec falha com erro no console, resposta 5xx ou violação de acessibilidade (axe).

Fluxos de `replica/recon.md`. F06 (álbum) e F07 (entrega final) ainda não foram construídos: casos listados, não rodados.

| caso | fluxo | tipo | passos | esperado | auto |
| --- | --- | --- | --- | --- | --- |
| F01-H1 | fotógrafo cria e envia | feliz | entrar, nova galeria, subir 6 JPEGs, liberar | galeria "Aguardando cliente", link copiável, e-mail com o link para o cliente | e2e |
| F01-E1 | | campos vazios | criar sem nome e sem cliente | erros nos campos, nada criado | e2e |
| F01-E2 | | texto longo + emoji e acentos | título de 120 caracteres com "💍 Ção" | salvo igual, sem rolagem lateral em 390px | e2e |
| F01-E3 | | duplo clique em Criar | clicar 2x rápido | uma galeria só | e2e |
| F01-E4 | | reenviar os mesmos arquivos | subir de novo os 6 | pulados, continua com 6 | e2e |
| F01-E5 | | formato não aceito | .CR3 e .HEIC | recusados com mensagem, os outros sobem | e2e |
| F01-E6 | | sessão expirada no meio | apagar o cookie e subir fotos | mensagem clara pedindo para entrar de novo; nada registrado | e2e |
| F01-E7 | | liberar sem fotos | galeria vazia | botão "Liberar" desligado | e2e |
| F01-E8 | | dados de outro fotógrafo | outro login abre a galeria e a API | 404 nas duas | e2e |
| F01-E9 | | só teclado | criar galeria usando Tab/Enter/Espaço | galeria criada | e2e |
| F01-N1 | | prazo no passado | data de ontem | recusado com mensagem | e2e |
| F01-N2 | | preço inválido | "abc" no preço da extra | recusado com mensagem | e2e |
| F02-H1 | cliente seleciona | feliz | abrir link, escolher 4 de 6 (pacote 4), revisar, enviar | "Seleção enviada!", galeria travada, e-mail ao fotógrafo | e2e |
| F02-E1 | | duplo clique no mesmo círculo | 2 cliques rápidos | tela e servidor iguais no fim | e2e |
| F02-E2 | | duas abas | marcar na aba A, recarregar a B | B mostra a seleção e o contador certos | e2e |
| F02-E3 | | sem internet | marcar offline | volta ao estado anterior e avisa | e2e |
| F02-E4 | | recarregar no meio | marcar 3, recarregar | 3 continuam marcadas | e2e |
| F02-E5 | | voltar da revisão | revisar, voltar | grade com a seleção | e2e |
| F02-E6 | | prazo vence com a página aberta | vencer prazo e clicar | recusado com a mensagem do prazo | e2e |
| F02-E7 | | duplo clique em Enviar | 2 cliques rápidos | um envio só | e2e |
| F02-E8 | | comentário com emoji, acento e HTML | "Linda! 😍 <b>oi</b>" | aparece como texto | e2e |
| F02-E9 | | comentário longo | 2001 caracteres pela API | recusado | e2e |
| F02-E10 | | outro fuso horário | navegador em America/Manaus | prazo mostrado com o fuso indicado, sem ambiguidade | e2e |
| F02-E11 | | só teclado | escolher e enviar com Tab/Enter | seleção enviada | e2e |
| F02-E12 | | celular 390px | todas as telas do cliente | sem rolagem lateral | e2e |
| F02-N1 | | link inexistente | /g/naoexiste | página 404 | e2e |
| F02-N2 | | galeria ainda em rascunho | abrir o link | 404 | e2e |
| F02-N3 | | senha errada e limite | 6 tentativas | "Senha incorreta", depois 429 | e2e |
| F02-N4 | | mexer depois de enviar | PUT na API | 409 com mensagem | e2e |
| F03-H1 | extras e PIX | feliz | 6 de pacote 4 (R$ 25), enviar, abrir pagamento | R$ 50,00, QR, copia-e-cola com CRC válido; fotógrafo confirma; cliente vê "confirmado" | e2e |
| F03-E1 | | fotógrafo sem chave PIX | abrir pagamento | aviso de que o fotógrafo manda os dados | e2e |
| F03-E2 | | reabrir e enviar menos | reabrir, desmarcar 1, enviar | pedido antigo cancelado, novo de R$ 25 | e2e |
| F03-N1 | | sem extras | pacote 2 sem extras, 3ª foto | recusada, aviso, contador 2 | e2e |
| F04-H1 | lista para o Lightroom | feliz | depois do envio, copiar lista e baixar CSV | nomes na ordem, CSV com favorita | e2e |
| F04-E1 | | nomes com vírgula, espaço e acento | "Noiva, véu (1).jpg" | lista e CSV não quebram | e2e |
| F04-E2 | | nome perigoso para planilha | "=1+1.jpg" | CSV não vira fórmula | e2e |
| F05-H1 | lembrete de prazo | feliz | prazo em 12h, rodar cron | e-mail "Último dia" ao cliente | e2e |
| F05-E1 | | cron 2x | rodar de novo | sem e-mail repetido | e2e |
| F05-N1 | | cron sem segredo | chamar sem token | 401 | e2e |
| F06-* | álbum | — | — | não construído (S09/S17 reservadas) | — |
| F07-* | entrega final | — | — | não construído (S18 reservada) | — |
| C-H1 | conta | feliz | PIX inválido recusado, válido salvo; apagar conta com confirmação | dados e login apagados | e2e |
| C-E1 | | teste grátis vencido | criar galeria | bloqueado com aviso | e2e |
| A11Y | todas | leitor de tela | axe em S01–S05, S08, S10–S16 | zero violações | e2e |
| M-1 | login real | manual | link mágico e Google no Supabase | entra e cai no painel | manual (precisa da conta) |
| M-2 | fotos | manual | upload e visualização pelo R2 | sobe e abre | manual (precisa da conta) |
| M-3 | e-mail | manual | e-mails chegam pela Resend, fora do spam | chegam | manual (precisa da conta) |
| M-4 | assinatura | manual | assinar no sandbox do Asaas, pagar, cancelar | status muda pelo webhook | manual (precisa da conta) |
| M-5 | Lightroom | manual | colar a lista em Texto → Nome do arquivo → Contém | filtra as escolhidas | manual (seu Lightroom) |
| M-6 | navegadores | manual | Safari iPhone e Chrome Android | grade, seleção, envio | manual |

## Resultado (2026-10-15)

- Automático: **33 specs Playwright** (todos os casos `e2e` acima) + **18 testes** de unidade/integração (`npm test`).
- 1ª rodada: 27 passaram, 6 falharam → 5 bugs do app (BUG-001 a 005), 1 de acessibilidade (BUG-006) e 1 erro do teste (F01-E9).
- Depois das correções (c15883b): **33/33 e 18/18 passando**, zero violações de acessibilidade (axe) em S01–S05, S08, S10–S16.
- Manuais M-1 a M-6: pendentes (precisam das suas contas, do seu Lightroom e dos seus aparelhos).

Como rodar: `cd web && npm run build && npx playwright test` (precisa de Postgres; banco `E2E_DATABASE_URL`, padrão `postgres://postgres@localhost:54330/app_e2e`, que é apagado a cada rodada).

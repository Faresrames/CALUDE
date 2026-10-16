# Build log

Dados: Postgres desde o /replica-backend (antes: camada falsa em arquivo, removida).
Armazenamento: R2 em produção, disco local em desenvolvimento. Ver `replica/backend.md`. Telas conferidas em 1440px e 390px; prints em `replica/clone-screens/`.

| ID | data | estado | o que falta | o que deu mais trabalho |
| --- | --- | --- | --- | --- |
| S01 | 2026-10-15 | done | testar com o Supabase real | — |
| S02 | 2026-10-15 | done | — | cartão estourava a largura no celular com título longo (corrigido) |
| S03 | 2026-10-15 | done | escolher pastas/momentos | prazo "até 23:59 de Brasília" sem fixar o fuso no código |
| S04 | 2026-10-15 | done | escolher pasta por lote; aceitar HEIC | redução + marca d'água no navegador (Web Worker + OffscreenCanvas); exige Safari 16.4+ |
| S05 | 2026-10-15 | done | responder comentário; marcar "sugestão" | — |
| S06 | 2026-10-15 | done (dentro de S05) | conferir o filtro "Contém" num Lightroom de verdade | — |
| S07 | 2026-10-15 | stub | lista de clientes | — |
| S08 | 2026-10-16 | done | — | marca d'água: logo PNG ou texto, opacidade, posição, prévia ao vivo com o mesmo código das fotos |
| S09 | 2026-10-16 | done | — | lâminas reduzidas a 2400px no navegador; histórico de versões com pinos |
| S10 | 2026-10-15 | done | testar no sandbox do Asaas; preços finais | Asaas pede CPF/CNPJ para cobrar |
| S11 | 2026-10-15 | done | — | — |
| S12 | 2026-10-15 | done | — | imagem carregava antes da hidratação e ficava invisível (corrigido no design) |
| S13 | 2026-10-15 | done | — | — |
| S14 | 2026-10-15 | done | — | — |
| S15 | 2026-10-15 | done | confirmação automática (v2) | BR Code conferido contra o exemplo do Banco Central |
| S16 | 2026-10-15 | done | — | — |
| S17 | 2026-10-16 | done | — | marcar ponto pelo teclado (Enter marca o centro); comentário na lâmina toda como alternativa |
| S18 | 2026-10-15 | stub | entrega final com zip | — |

## Mais difícil do que parecia

- **Estado da camada falsa em produção.** O Next empacota cada rota separado; a camada
  falsa guardava os dados numa variável de módulo e cada rota tinha a sua cópia: uma
  rota criava a galeria e outra regravava o arquivo sem ela. Corrigido guardando o
  estado no `globalThis`. Não afeta o banco real, mas mostra por que o backend tem
  que ser o Postgres e não arquivo.
- **Upload no navegador** ficou rápido (20 fotos em 1,6 s no teste), mas o teste usa
  JPEGs pequenos gerados na hora. Com fotos reais de 20 MB, medir num notebook comum
  antes de prometer tempo.

## Testes de ponta a ponta (Chromium, prod build)

Fotógrafo (1440px) e cliente (390px):
- sem login → /entrar; validação do formulário mostra os erros;
- 20 JPEGs sobem reduzidos com marca d'água; RAW recusado; reenvio pula repetidas;
- cliente escolhe 12 num pacote de 10 → "+2 extras · R$ 50,00"; favorita; comenta;
  recarrega e continua tudo salvo; revisa; envia; galeria trava (API devolve 409);
- fotógrafo vê "Seleção recebida", copia a lista para o Lightroom e baixa o CSV;
- outro fotógrafo recebe 404 na galeria e na API;
- senha: errada recusada, API fechada antes da senha, 6ª tentativa no minuto → 429;
- pacote sem extras: a 3ª foto é recusada com aviso e volta a ficar desmarcada;
- só teclado: Tab chega na seleção e Enter seleciona;
- nenhuma tela com rolagem lateral em 390px.
Não testado ainda: prazo vencido de ponta a ponta (a regra é a mesma do banco,
validada no schema), leitor de tela (axe) e Safari.

## /replica-backend (2026-10-15)

- Camada falsa trocada por Postgres; 16 testes de integração; ponta a ponta repetido no Postgres.
- Bugs achados pelos testes: numeração das fotos pulava quando o lote tinha nomes repetidos;
  e-mail aparecia na URL depois do pedido de link de login; `audit fix` atualizou o supabase-js
  e quebrou os tipos do @supabase/ssr (atualizado para 0.12.7).
- Não testado sem as contas: Supabase Auth real, R2, Resend, Asaas (ver `replica/backend.md`).

## /replica-test (2026-10-15)

- Suíte Playwright em `web/e2e/` (33 specs, axe em toda tela, falha com erro de console ou 5xx) + 18 testes de unidade/integração.
- 6 bugs achados e corrigidos (c15883b): sessão expirada no envio, título longo no celular, prazo sem fuso,
  CSV com vírgula, CSV virando fórmula, ordem dos títulos. Detalhes em `replica/bugs.md`.

## Marca d'água e álbum (2026-10-16)

- Migração 0002 (tamanho das lâminas, aviso "álbum decidido", padrão da marca d'água em diagonal).
- Paridade 82,4 → 90,4; essenciais 13/13. +4 specs e +3 testes de dados, todos passando.
- Pego antes de enviar: a posição padrão da marca d'água tinha virado "centro" (protege menos); voltou para diagonal.

# Build log

Dados: camada FALSA (`web/src/lib/data/fake.ts`, arquivo `web/.data/db.json`) e
armazenamento FALSO (`web/src/lib/storage`, disco com URLs assinadas, imitando o R2).
Mesmas funções do contrato `DataLayer`: o /replica-backend troca a implementação
sem mexer nas telas. Telas conferidas em 1440px e 390px; prints em `replica/clone-screens/`.

| ID | data | estado | o que falta | o que deu mais trabalho |
| --- | --- | --- | --- | --- |
| S01 | 2026-10-15 | partial | login de verdade (Supabase: e-mail + Google) | — |
| S02 | 2026-10-15 | done | — | cartão estourava a largura no celular com título longo (corrigido) |
| S03 | 2026-10-15 | done | escolher pastas/momentos | prazo "até 23:59 de Brasília" sem fixar o fuso no código |
| S04 | 2026-10-15 | done | escolher pasta por lote; aceitar HEIC | redução + marca d'água no navegador (Web Worker + OffscreenCanvas); exige Safari 16.4+ |
| S05 | 2026-10-15 | done | responder comentário; marcar "sugestão" | — |
| S06 | 2026-10-15 | done (dentro de S05) | conferir o filtro "Contém" num Lightroom de verdade | — |
| S07 | 2026-10-15 | stub | lista de clientes | — |
| S08 | 2026-10-15 | stub | marca d'água PNG, logo, chave PIX, e-mails | — |
| S09 | 2026-10-15 | stub | aprovação de álbum (fotógrafo) | — |
| S10 | 2026-10-15 | stub | plano e assinatura (Asaas) | — |
| S11 | 2026-10-15 | done | — | — |
| S12 | 2026-10-15 | done | — | imagem carregava antes da hidratação e ficava invisível (corrigido no design) |
| S13 | 2026-10-15 | done | — | — |
| S14 | 2026-10-15 | done | — | — |
| S15 | 2026-10-15 | stub | PIX (BR Code) e confirmação pelo fotógrafo | — |
| S16 | 2026-10-15 | done | — | — |
| S17 | 2026-10-15 | stub | aprovação de álbum (cliente) | — |
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

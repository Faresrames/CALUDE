# Componentes (replica-design v0)

Visual criado do zero (sem prints do original): neutros quentes, foto em
destaque, títulos em serifa (Fraunces), interface em Inter, lightbox escuro.
Ícones: Lucide (ISC). Fontes: Inter e Fraunces (SIL OFL), servidas pelo
próprio app via `@fontsource`. Nada do Select/EPICS.

Código: `web/src/components/ui/`. Vitrine com todos os estados: `/design`
(`web/src/app/design/`). Prints: `replica/design/screens/`.

Tokens: `replica/design/tokens.json` → `npm run tokens` → `web/src/styles/tokens.css`
→ `@theme` em `web/src/app/globals.css`. Componentes usam só as classes dos
papéis (`bg-surface`, `text-muted`, `border-line`, `bg-selected`…), nunca hex.

Contraste: `python3 .claude/skills/replica-design/contrast.py replica/design/tokens.json`
→ 27 pares, 0 falhas AA.

Foco: todo elemento focável tem anel de 2px na cor `focus` com 2px de
afastamento (global em `globals.css`). `prefers-reduced-motion` zera as transições.

```
Button
  variants  primary, secondary, ghost, danger
  sizes     sm 32px, md 40px, lg 48px (lg = botões do cliente no celular)
  states    default, hover, focus-visible, disabled, loading (spinner + aria-busy, texto continua)
  tokens    primary: bg accent / text on-accent; secondary: bg raised + border-input; radius md; text sm/600
  a11y      <button> real; loading desabilita sem esconder o texto
  used on   todas

Field (input com rótulo)
  variants  text, number, date, password
  states    default, focus, disabled (bg surface), error (borda danger + mensagem), hint
  tokens    bg raised, border border-input, radius md, altura 40px
  a11y      <label for>, aria-invalid, aria-describedby aponta para erro ou dica
  used on   S01, S03, S08, S11

Switch
  states    on, off, disabled
  tokens    on: bg selected; off: bg surface + border-input
  a11y      <button role="switch" aria-checked>, rótulo ligado por for/id
  used on   S03, S08

StatusBadge
  variants  draft "Rascunho", sent "Aguardando cliente", in_progress "Escolhendo",
            submitted "Seleção recebida", expired "Prazo vencido", delivered "Entregue", archived "Arquivada"
  tokens    contorno + texto na cor do papel (muted, info, warning, success, danger, ink), radius pill
  a11y      cor nunca é o único sinal: sempre tem texto
  used on   S02, S05

GalleryCard
  states    com capa, sem capa (surface), hover (sombra pop), focus
  content   título, cliente · data, status, nº de fotos, escolhidas/pacote, prazo
  a11y      o cartão inteiro é um <a>
  used on   S02, S07

EmptyState
  content   ícone, título em serifa, texto, ação
  used on   S02 vazio, S07 vazio, S12 galeria sem fotos, S05 sem comentários

PhotoTile
  variants  normal, selecionada (anel 3px selected), favorita (coração favorite-on-dark),
            com comentários (contador), sugestão do fotógrafo (etiqueta), só leitura
  states    carregando (bloco pulsando), carregada (fade 200ms), não carregou (ícone + texto),
            hover (check aparece a 70%), focus
  tokens    radius sm, faixa inferior lightbox→transparente, botões 32px
  a11y      três botões separados: abrir, favoritar, selecionar; aria-pressed nos dois toggles;
            aria-label com o nome do arquivo; botão direito e arrastar bloqueados na imagem
  note      confere img.complete ao montar (a imagem pode carregar antes da hidratação)
  used on   S05, S12, S18

SelectionCounter
  states    abaixo do pacote (barra selected), pacote completo (dica: extra custa X ou desmarque),
            acima do pacote (barra warning + "+N extras · R$")
  a11y      role="status" aria-live="polite": leitor de tela anuncia a contagem
  rule      mostra o número que o servidor confirmou
  used on   S12 (fixo no topo), S13, S14

Lightbox
  layout    fundo lightbox-bg, foto contida, setas laterais, rodapé com Favoritar/Selecionar,
            painel de comentários à direita (desktop) ou embaixo (celular)
  states    aberta, primeira/última foto (seta desabilitada), selecionada, favorita, só leitura
  keys      ← → navegam · S ou espaço seleciona · F favorita · Esc fecha (ignorados enquanto digita)
  a11y      Radix Dialog: foco preso, título "IMG_x · n de N", Esc fecha, foco volta ao bloco
  used on   S13, S17

Dropzone + UploadList
  states    dropzone: normal, arrastando por cima (borda focus), desabilitado
            item: na fila, enviando (barra + %), enviada (check success), erro (mensagem + tentar de novo)
  a11y      <label> com <input type="file" multiple> escondido (teclado funciona), contador aria-live
  used on   S04, S09

CommentThread
  variants  claro (painel do fotógrafo), escuro (dentro do lightbox)
  states    vazio, com comentários, enviando desabilitado sem texto, desabilitado (galeria travada)
  a11y      <textarea> com rótulo escondido, limite de 2000 caracteres (igual ao banco)
  used on   S05, S13, S17

PixPanel
  states    aguardando (QR + copia-e-cola + Copiar → "Copiado"), pago (success), expirado (danger)
  note      o QR aqui é um ícone de reserva; o /replica-build gera o QR real a partir do BR Code
  used on   S15

Toast
  variants  success (role=status), error (role=alert)
  behaviour some em 4s, fecha no X, empilha embaixo no centro
  used on   todas
```

Layout: conteúdo máx. 1200px; grade de fotos com mínimo de 160px (110px no
celular) e 8px de espaço; cabeçalho 64px; barra lateral do painel 240px;
quebras em 640, 768, 1024 e 1280.

Conferido em 1440×900 e 390×844: sem erro no console além do 404 proposital
da foto de demonstração "não carregou".

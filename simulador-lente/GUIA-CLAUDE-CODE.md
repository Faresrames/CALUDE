# Guia para o Claude Code: Simulador de Lente 24-70 em 3D

> **Como usar este arquivo**
>
> 1. Crie uma pasta para o projeto (ex.: `simulador-lente`) e coloque este arquivo dentro.
> 2. Se você também baixou o `index.html` pronto, coloque-o na mesma pasta. Ele é a versão de referência.
> 3. Abra o Claude Code nessa pasta e digite:
>
>    ```
>    Leia o arquivo GUIA-CLAUDE-CODE.md e siga as etapas, uma por vez. Ao fim de cada etapa, me mostre o resultado e espere eu aprovar antes de seguir.
>    ```
>
> 4. Se quiser só adaptar a versão pronta (cores, textos, logo), diga:
>
>    ```
>    Leia o GUIA-CLAUDE-CODE.md e o index.html. Quero adaptar: [o que você quer mudar].
>    ```

---

## 1. Objetivo

Uma página única (um arquivo `index.html`) para o site de um fotógrafo de casamento. Ela ensina, brincando, como a lente **24-70mm f/2.8** funciona:

- **Abertura** (f/2.8 até f/22): muda o desfoque do fundo e a luz que entra.
- **Distância focal** (24 até 70mm): é o zoom; muda o enquadramento e também o desfoque.
- **Distância** da câmera até o casal e do casal até o fundo.

O visitante vê uma **cerimônia de casamento em 3D no estilo "brinquedo"** (peças arredondadas, cores vivas, luz suave, como animações feitas no Blender) e o desfoque é calculado com a **física real da lente**.

Público: noivos e fotógrafos iniciantes. Tudo em **português do Brasil**, com linguagem simples.

---

## 2. Regras técnicas

- **Um único arquivo** `index.html`, com HTML, CSS e JavaScript dentro dele.
- **three.js 0.147.0** carregado pela CDN (versão fixa, sem `latest`):
  ```html
  <script src="https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/geometries/RoundedBoxGeometry.js"></script>
  ```
- Fontes do Google Fonts: **Bricolage Grotesque** (títulos), **Nunito Sans** (texto), **JetBrains Mono** (números) e **Caveat** (legenda das polaroids).
- Precisa de **WebGL 2**. Se não houver, mostrar a mensagem: "Seu navegador não liberou o 3D. Abra no Chrome, Safari ou Edge atualizados."
- Funcionar no **celular** (visor em 4:5 abaixo de 600px de largura, sem rolagem lateral) e no **modo escuro** (cores definidas como variáveis CSS no `:root`, redefinidas em `prefers-color-scheme: dark`).
- Respeitar `prefers-reduced-motion`.

---

## 3. A física (não simplificar)

Câmera **full frame**: sensor de 36 × 24 mm e **círculo de confusão de 0,03 mm**.

Variáveis: `f` = distância focal (mm), `N` = número f, `F` = distância de foco (mm), `z` = distância do ponto (mm).

**Diâmetro do desfoque no sensor (mm):**
```
c = (f² / (N · (F − f))) · |z − F| / z
```
Em pixels: `raio_px = c × (altura_da_imagem_px / altura_do_filme_mm) / 2`.

**Profundidade de campo:**
```
H     = f² / (N · 0,03) + f                 (hiperfocal)
perto = F · (H − f) / (H + F − 2f)
longe = F · (H − f) / (H − F)    (se F < H; senão, infinito)
```

**Campo de visão da câmera 3D:** `fov_vertical = 2 · atan((altura_do_filme / 2) / f)`. A altura do filme depende da proporção da tela: 3:2 usa 36 × 24; para outras proporções, recortar mantendo o sensor.

**Velocidade equivalente** (para mostrar a perda de luz): base f/2.8 a 1/1000, ISO 100. Tempo = `(1/1000) · (N / 2,8)²`, arredondado para a velocidade padrão mais próxima (1/8000 … 1/8).

**Luz que entra:** `(2,8 / N)² × 100%`.

Paradas de abertura (terços): 2.8, 3.2, 3.5, 4, 4.5, 5, 5.6, 6.3, 7.1, 8, 9, 10, 11, 13, 14, 16, 18, 20, 22.

---

## 4. Etapas

Faça **uma etapa por vez**. Ao final de cada uma, abra a página no navegador, mostre o resultado e espere aprovação.

### Etapa 1: Estrutura da página e visual

- Cabeçalho: selo "Laboratório de lente · 24-70mm f/2.8", título **"Gire a lente e veja o fundo derreter"** (com "fundo derreter" num marca-texto amarelo) e uma frase de apoio.
- Paleta: fundo azul-céu bem claro, texto quase preto, verde-menta como destaque, amarelo `#ffc83a` como cor "pop".
- Botões com cara de brinquedo: borda grossa escura e sombra sólida embaixo, que "afunda" ao clicar.
- Área do visor: cantos bem arredondados (24px), proporção 3:2 (4:5 no celular).

**Checagem:** a página abre sem erros no console e não rola para o lado no celular.

### Etapa 2: A cena 3D estilo brinquedo

Unidade: metros. O casal fica em `z = 0`; a câmera fica em `(0; 1,5; distância)` olhando para `-z`.

Monte com `RoundedBoxGeometry`, esferas e cilindros, usando material fosco (`MeshStandardMaterial`, `roughness` ≈ 0,6):

| Elemento | Onde | Detalhes |
|---|---|---|
| Gramado | chão | verde vivo |
| Altar de madeira | `z ≈ -0,35` | 8 tábuas com dois tons de madeira |
| Tapete do corredor | de `z = 1` a `z = 17` | creme, com pétalas espalhadas |
| Noiva | `x = -0,32` | saia em `LatheGeometry`, corpete, cabeça "bloco", olhos com brilho, bochechas, sorriso, coque e buquê |
| Noivo | `x = +0,34` | terno azul-marinho, camisa, gravata-borboleta, flor na lapela, cabelo com topete |
| Arco de flores | `z = -1,5` | dois pilares e um meio-toro, com cachos de flores (rosa, branco, pêssego) e folhas |
| Arbustos | `z = -3,4` | fileira de esferas verdes |
| Varal de luzinhas | entre `z = -3,6` e `-7,8` | 4 postes, fios em curva, lâmpadas com `MeshBasicMaterial` **muito brilhante** (cor × 5 a 7) para gerar bokeh |
| Árvores | `z = -10` a `-26` | tronco e copa de várias esferas |
| Cadeiras | `z = 2,4` a `10,2` | brancas, viradas para o altar; as do corredor com laço de flores |
| Montanhas e nuvens | muito longe | formas grandes e suaves |
| Céu | esfera grande | degradê azul → pêssego, com sol baixo atrás da cena |
| Pétalas caindo | perto do casal | `InstancedMesh` com uns 90 itens, girando e balançando |

Luz: `HemisphereLight` (céu claro / chão verde), uma luz principal quente vinda da frente com **sombras suaves** e uma luz de contorno alaranjada vinda de trás (golden hour). Os noivos balançam de leve.

Cada grupo recebe `userData.label` ("Noiva", "Noivo", "Arco de flores", "Luzes", "Árvores", "Cadeiras"…), usado no toque para focar.

**Checagem:** em 24mm aparece a cerimônia inteira; em 70mm a 2,8m aparecem os rostos e o tronco do casal.

### Etapa 3: Desfoque físico (pós-processamento)

Em cada quadro:

1. Renderizar a cena num `WebGLRenderTarget` de **cor** (`HalfFloatType`, para as luzes passarem de 1.0; `samples: 4`; mipmaps ligados).
2. Renderizar de novo com `scene.overrideMaterial = MeshDepthMaterial({ depthPacking: RGBADepthPacking })` num alvo de **profundidade**.
3. Desenhar um quadrado de tela inteira com um shader que:
   - converte a profundidade em distância (`perspectiveDepthToViewZ`);
   - calcula o raio de desfoque de cada pixel com a fórmula da seção 3;
   - faz uma **coleta em espiral** (cerca de 84 amostras, ângulo áureo, rotação aleatória por pixel) até um raio máximo calculado na CPU;
   - para cada amostra, soma a cor se o desfoque dela "cobre" o pixel central. Amostras **atrás** do centro têm o raio limitado ao do centro, para o fundo não vazar sobre a noiva em foco;
   - deixa o **bokeh com o formato do diafragma**: 9 lâminas, redondo em f/2.8 e virando polígono até f/7;
   - lê as amostras vizinhas num mipmap mais baixo, para suavizar o ruído;
   - aplica tone mapping ACES, um leve aumento de saturação, vinheta e conversão para sRGB.
4. Ajustar a resolução sozinho: se o quadro passar de ~30ms, reduzir a escala até 0,6.

**Checagem:** em 70mm f/2.8 o fundo fica bem desfocado e as luzinhas viram bolas grandes; em 24mm f/16 quase tudo fica nítido.

### Etapa 4: Controles simples

- **Anel de abertura** (controle principal, logo abaixo do visor): uma faixa escura com textura de borracha, que se arrasta para os lados com números gravados (2.8, 4, 5.6, 8, 11, 16, 22) e risquinhos nos terços, e um triângulo amarelo no centro marcando o valor. Ao soltar, "encaixa" no terço mais próximo. Também funciona com a rodinha do mouse e com as setas (`role="slider"`).
- Ao lado do anel: desenho do **diafragma** abrindo e fechando, o valor grande ("f/2.8") e "100% de luz · 1/1000".
- **Tocar para focar:** um raycast no ponto tocado move o foco suavemente até lá, e um quadradinho verde com o nome do objeto acompanha o ponto.
- Botão **"Mais controles"** (fechado de início): anel de zoom de 24 a 70, controle de distância (2 a 12 m), botões de foco rápido e situações prontas (Retrato 70mm f/2.8 a 2,8m · Casal e cenário 35mm f/4 · Cerimônia toda 24mm f/8 · Tudo nítido 24mm f/16).
- **Legenda grande** no estilo de vídeo: texto branco com contorno preto grosso e palavra-chave em amarelo, que aparece ao soltar o anel ("FUNDO DERRETIDO", "TUDO NÍTIDO", "MAIS NITIDEZ").
- Selo no canto do visor: "70mm f/2.8 · 1/1000 · ISO 100".

### Etapa 5: Extras

- **Tour guiado:** 7 passos de cerca de 3,6s cada, com transições suaves e legenda grande:
  1. Fundo derretido (70mm f/2.8)
  2. Troca de foco (foco no arco)
  3. f/5.6
  4. f/11
  5. 24mm
  6. 24mm em f/2.8
  7. Volta pro retrato

  Termina com "SUA VEZ". Qualquer toque nos controles interrompe o tour.
- **Comparar f/2.8 × f/16:** tela dividida, com uma linha arrastável (duas passadas do shader usando `setScissor`).
- **Tirar foto:** som de obturador (Web Audio com dois estalos de ruído filtrado), flash branco e uma polaroid inclinada numa fileira abaixo do visor, com a legenda manuscrita "70mm · f/2.8 · 1/1000 / foco: noiva" (máximo de 10 fotos).
- **Desafio "Qual abertura?":** renderiza uma foto com f/2.8, f/5.6 ou f/16 sorteado e mostra três botões de resposta, a explicação e o placar.

### Etapa 6: Régua e explicação

- **"O que fica nítido":** régua em escala logarítmica (0,5 a 60 m) com uma faixa verde da profundidade de campo, ícone de câmera, linha do foco e pontos para Cadeiras, Noiva, Arco, Luzes e Árvores (verde com ✓ se estiver nítido). Mais uma frase do tipo: "Foco em noiva a 2,65 m, em f/2.8 e 70mm: fica nítido só 9 cm…".
- **Três cartões:** Abertura · Distância focal · Distância.
- **Regra final:** "Para mais desfoque: número f menor, mais zoom, mais perto do casal e fundo mais longe."
- **Rodapé:** "Simulação full frame, círculo de confusão de 0,03 mm."

### Etapa 7: Testes finais

- [ ] Sem erros no console.
- [ ] Celular (390px): sem rolagem lateral, anel arrastável com o dedo, visor em 4:5.
- [ ] Modo escuro legível.
- [ ] Desempenho aceitável num celular comum (a resolução se ajusta sozinha).
- [ ] Toque para focar, tour, comparação, foto e desafio funcionando.
- [ ] Testar abrindo com um servidor local (`npx serve .` ou `python3 -m http.server`).

---

## 5. Como colocar no site

- **Página própria:** suba o `index.html` como, por exemplo, `seusite.com.br/lente-24-70/`.
- **Dentro de outra página:**
  ```html
  <iframe src="/lente-24-70/" style="width:100%; height:1800px; border:0" loading="lazy" title="Simulador de lente 24-70"></iframe>
  ```
- WordPress: bloco "HTML personalizado" com o iframe acima, apontando para o arquivo enviado.

---

## 6. Ideias para personalizar depois

- Cores e fontes da sua marca.
- Seu logo numa plaquinha de madeira ao lado do altar.
- Outros cenários: praia ao pôr do sol, igreja, salão de festa à noite (mais luzes = mais bokeh).
- Escolher a cor do vestido e do terno.
- Botão "Agende seu ensaio" no fim da página, levando ao seu WhatsApp.

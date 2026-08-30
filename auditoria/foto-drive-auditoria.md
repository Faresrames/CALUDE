# Auditoria Foto Drive — Parte 1 não executada, Parte 2 entregue

Data: 30/08/2026 · Escopo pedido: teste funcional (20 itens), análise competitiva, relatório.

---

## 0. VEREDITO DE ACESSO — leia antes de tudo

**A Parte 1 (teste funcional, itens 1 a 20) não foi executada. Nenhum item. Zero.**

Três motivos, em ordem de gravidade:

| # | Bloqueio | Evidência |
|---|---|---|
| 1 | **A sessão não tem internet aberta.** Só busca web (server-side) e GitHub funcionam. | `curl https://example.com` → `CONNECT tunnel failed, response 403`. Idem `google.com`, `vercel.com`. O proxy de egress da organização recusa qualquer host fora de uma allowlist (Anthropic API, npm, PyPI, crates, GitHub). |
| 2 | **A URL do produto não foi preenchida.** | O prompt chegou com o literal `URL: [COLAR]`. |
| 3 | **As credenciais não foram preenchidas.** | O prompt chegou com o literal `Conta de teste do fotógrafo: [COLAR EMAIL E SENHA]`. |
| 4 | **Não há código para auditar como alternativa.** | O repositório da sessão (`Faresrames/CALUDE`) está vazio — zero commits. `list_repos` na conta retorna esse único repositório. Nenhum repositório do Foto Drive está anexado. |

Ponto importante e desconfortável: **preencher a URL e a senha não resolve sozinho.** O bloqueio nº 1 é independente. Chromium e Playwright estão pré-instalados nesta máquina, mas saem pelo mesmo proxy — abrir o Foto Drive daqui vai dar 403 do mesmo jeito. Para rodar a Parte 1 é preciso *ou* liberar o domínio do Foto Drive na política de egress do ambiente, *ou* rodar a auditoria em um ambiente com rede aberta, *ou* anexar o repositório do código para uma auditoria estática (que cobre a maior parte da seção de segurança, mas não cobre upload, progresso, mobile e UX).

**Consequência para o relatório:** as seções B (FUNCIONA), C (NÃO FUNCIONA) e D (INCOMODA) estão vazias e vão continuar vazias. Preenchê-las com suposição a partir da stack seria inventar achado, que é exatamente o que uma auditoria não pode fazer. O que existe no lugar delas é um protocolo de teste pronto para execução (seção C′) e uma matriz de risco arquitetural específica de Supabase + R2 multi-tenant (seção C″), que é a inferência legítima possível sem acesso — e está rotulada como hipótese, não como achado.

---

## PARTE 2 — ANÁLISE COMPETITIVA

Fonte: buscas públicas em agosto/2026. **Aviso de confiabilidade:** os sites brasileiros (`picsize.com.br`, `zakar.com.br`, `fotoo.pro`, `fotoapp.com.br`, `snapgallery.com.br`, `exposure.com.br`, `goimage.com.br`) estão bloqueados pelo mesmo proxy de egress, então não foi possível abrir as páginas de planos. Onde o preço aparece abaixo, veio de snippet de busca ou de material de terceiro. Onde não veio, está marcado **`não obtido`** — e não deve ser tratado como se fosse.

### E.1 — Internacional

| Plataforma | Preço e modelo | Armazenamento | Além da entrega | Pagamento | Idioma / suporte |
|---|---|---|---|---|---|
| **Pixieset** (CA) | Free (15% de comissão na loja); Basic $10; Plus $20; Pro $50; Ultimate ~$50 — desconto anual | 3GB free / 10GB / 100GB / 1TB / ilimitado | Site, loja com fulfillment, Studio (contrato, fatura), app móvel, vídeo | Cartão internacional, USD | EN + PT parcial; sem suporte BR |
| **Pic-Time** (IL) | Free; Beginner $8; Professional $25; Advanced $50 | 10GB / 100GB / ilimitado | Art Store, slideshow, prova de álbum, automação de marketing, multi-marca, blog | Cartão internacional, USD | Interface em PT-BR; suporte EN |
| **ShootProof** (US) | Free (100 fotos); $10 / $20 / $30 / $50 — **cobra por número de fotos, não por GB** | 100 / 1.500 / 5.000 / 25.000 / ilimitado fotos | Loja, contratos, faturas, marketing, app móvel de galeria | Cartão internacional, USD | EN |
| **CloudSpot** (US) | Free (15% comissão, só JPEG); Entry $7; Lite $17 ($12 anual); Pro $34; Unlimited $50 ($34 anual) | 5GB / 15GB / 100GB / 500GB / ilimitado | Loja, Studio, captura de e-mail do visitante, expiração com lembrete, controle de tamanho de download | Cartão internacional, USD | EN |
| **SmugMug** (US) | Direct $20; Portfolio $23,50; Pro $37 (anual). Sem plano free | Ilimitado — **mas RAW é cobrado à parte, a partir de $10/1TB** | Site completo, venda, lab de impressão, SEO, analytics | Cartão internacional, USD | EN |
| **Zenfolio** (US) | Basic $9 ($7 anual); Professional $23 ($11,50 anual); Advanced $40 ($20 anual) | 15GB no Basic; sobe por tier | Site, venda com Smart Pricing, agendamento/booking, CRM | Cartão internacional, USD | EN |
| **PicDrop** (DE) | Free (1GB, 3 galerias); Pro €17,99/mês (€14,99 anual); Advanced acima. Lite foi descontinuado em mai/2026 | 500GB no Pro (teto 750GB); +250GB por €7,99; Advanced até 2,5TB | Seleção colaborativa, modo apresentação, marca própria. **Não tem loja** | Cartão, SEPA, EUR | DE/EN |
| **Pixellu Galleries** (US) | ~$8–16/mês (anual) na entrada; ilimitado ~$32/mês anual; bundle 4 apps $40/mês | Por tier; nº de galerias ativas amarrado ao storage | SmartAlbums (diagramação), SmartSlides (slideshow) no bundle | Cartão internacional, USD | EN |
| **Format** (CA) | Basic $10 / Pro $12–17 / Pro Plus $15–26 anual; mensal ~2x | Pro 100GB e 1.500 imagens; Pro Plus 1TB e ilimitado | Portfólio/site, prova de cliente, loja, **integração profunda com Lightroom** | Cartão internacional, USD | EN |
| **Narrative / Flothemes** | Narrative por assinatura (~$480/ano no premium); temas Flothemes a partir de $279 avulso | n/a | Culling (Select), montagem de post de blog (Publish), tema WordPress | Cartão internacional, USD | EN |
| **WeTransfer** | Free (10 transfers/mês, 2GB); Starter $8; Ultimate $23; Teams $19/usuário | 2TB de conta em todos os planos pagos | **Nada.** Só transferência. Sem marca, sem seleção, sem senha por galeria decente | Cartão internacional | EN/PT |
| **Dropbox / Google Drive** | Google One BR: 100GB R$9,99; 200GB R$14,99. Dropbox Plus ~$11,99/2TB | 100GB–2TB+ | **Nada de fotográfico.** Entrega improvisada por pasta compartilhada | **Aceita cartão e boleto no Brasil** | PT-BR completo |

> Duas inconsistências nas fontes, registradas em vez de escondidas: (a) uma fonte lista Pixieset Pro e Ultimate no mesmo preço de $50, o que provavelmente é erro de scraping; (b) uma fonte lista Google One 200GB e 2TB ambos a R$14,99, o que é impossível. Confirmar direto na fonte antes de usar em material comercial.

### E.2 — Brasil

| Plataforma | Preço e modelo | Limite | Além da entrega | Pagamento | Idioma |
|---|---|---|---|---|---|
| **EPICS Select** | **R$19/mês (2.000 fotos) até R$190/mês (140.000 fotos)**; −10% semestral, −13% anual; teste 14 dias sem cartão | Por número de fotos | Seleção, aprovação de álbum, separação automática dos arquivos no computador, venda de fotos, sites | BR nativo | PT-BR, suporte BR |
| **Picsize** (Gallery Pro) | Versão gratuita sem corte de recursos; paga ao ultrapassar volume de arquivos. **Valor não obtido** | Por volume de arquivos | Galeria de seleção com limite de escolhas e preço por foto extra, prova de álbum, site com SEO, editor de design | BR nativo | PT-BR, suporte BR |
| **FotoApp** | Start / Pro / Studio / Enterprise. **Valores não obtidos.** +1.200 fotógrafos | Não obtido | Seleção, **repasse automático via Pix**, site + domínio, venda de foto extra, módulo de impressão, CRM, gestão de job e equipe | **Pix**, BR nativo | PT-BR, suporte BR |
| **Zakar** | Free real + mensalidade fixa (posicionada como mais barata que crédito por foto). **Valores não obtidos** | Não obtido | Marca d'água automática no upload, anti-print/ofuscamento, agendamento de ensaio, orçamento, **contas a receber / financeiro** | BR nativo | PT-BR |
| **Fotoo.pro** | **Valores não obtidos.** Garantia de 7 dias, sem multa de cancelamento | Não obtido | Galerias premium, slides cinematográficos, compartilhamento | BR nativo | PT-BR |
| **Exposure** (exposure.com.br) | **Valores não obtidos** | Galerias e apps ilimitados | **App de marca própria para o cliente final**, armazenamento de originais, senha na galeria + **PIN separado para download**, tema claro/escuro | BR nativo | PT-BR |
| **Snap Gallery** | **Valores não obtidos** | Não obtido | Seleção, galeria personalizável, entrega | BR nativo | PT-BR |
| **Go Gallery** (Go Image) | Grátis até 300 imagens; **Go Prime** libera 10.000–100.000 imagens. Valor não obtido. Inclui 3% de cashback e R$500/ano de crédito | Por número de imagens | Loja pré-configurada com impressos **e** digital, margem definida pelo fotógrafo, dashboards. **Amarrado à encadernadora Go Image** | BR nativo | PT-BR |
| **Fotop** | **Sem mensalidade — comissão de 8% a 15% (base 10%)**, mais taxa de upload em alguns tipos de evento | Sem limite prático | Venda de foto de evento e esportiva, reconhecimento facial, gestão multi-fotógrafo | BR nativo | PT-BR |
| *(referência de preço)* **Snap Me Camera** | R$49,90/mês ou R$399/ano | 60GB, galerias ilimitadas | Seleção e entrega | BR nativo | PT-BR |

---

### O que quase todos têm

Ordenado por quantos concorrentes têm. **Sem acesso ao produto, não é possível afirmar o que o Foto Drive tem ou não tem** — esta é a lista de referência contra a qual ele precisa ser conferido, não uma acusação.

1. **Seleção / proofing pelo cliente final** — o cliente marca as fotos escolhidas, com limite de N inclusas e cobrança de extras. EPICS, Picsize, FotoApp, Zakar, Snap Gallery, Go Gallery, Pixieset, Pic-Time, CloudSpot, ShootProof, PicDrop, Format. **Este é o item nº 1 e é decisivo:** no Brasil o produto vendido não se chama "entrega de fotos", se chama "seleção e entrega". Um produto que só entrega compete com o WeTransfer, não com a EPICS.
2. **Aprovação/prova de álbum** — EPICS, Picsize, Pic-Time, Pixellu, ShootProof.
3. **Venda de extras com margem do fotógrafo** — quase todos, e é a razão de existir da Go Gallery, Fotop, Pixieset, Pic-Time, ShootProof.
4. **Marca do estúdio / white-label real** (logo, cor, domínio ou subdomínio próprio, e-mail com a marca) — universal nos pagos.
5. **Marca d'água automática no upload** — Zakar, Picsize, SmugMug, ShootProof.
6. **Captura de e-mail do visitante e analytics da galeria** (quem abriu, o que baixou, quando) — CloudSpot, Pixieset, Pic-Time, ShootProof.
7. **Expiração com aviso prévio e arquivamento** — CloudSpot faz com lembrete; quase todos têm expiração.
8. **Download por tamanho** (web vs. alta resolução) e **ZIP em lote confiável** — universal.
9. **App móvel ou PWA com "salvar na galeria do celular"** — Pixieset, ShootProof, Pixellu, Exposure (app de marca própria).
10. **Site/portfólio incluso** — Pixieset, Zenfolio, SmugMug, Format, Picsize, FotoApp, EPICS.
11. **Plano gratuito de verdade como funil** — Pixieset, Pic-Time, CloudSpot, ShootProof, PicDrop, Picsize, Zakar, Go Gallery.
12. **Financeiro / CRM / agendamento** — Zakar, FotoApp, Zenfolio, Pixieset Studio, ShootProof.

### O que seria diferencial real do Foto Drive

Novamente: **hipótese derivada da stack que você descreveu**, não observação.

- **R2 com egress zero.** O custo de saída de dados é R$0. Isso não é detalhe técnico, é uma posição comercial que quase ninguém pode copiar: quem está em S3/GCS paga por GB baixado, e por isso limita download, limita ZIP em lote e cobra caro por "ilimitado". Com R2 dá para oferecer **download ilimitado, ZIP completo sem punição e galeria que fica no ar por anos** com custo marginal previsível. Isso vira mensagem de venda: *"baixe quantas vezes quiser, nós não cobramos por isso"*. Nenhum concorrente da lista comunica isso.
- **Pagamento nativo em BRL com Pix.** Todo o bloco internacional cobra em dólar no cartão internacional — IOF, variação cambial, recusa de cartão. Só o bloco BR resolve isso, e dentro dele só a FotoApp comunica Pix como recurso central.
- **Custo por GB baixíssimo na origem** (ver seção de preço abaixo), o que permite ser o mais barato do mercado BR e ainda ter margem de 5x a 8x.

Nada disso é diferencial se não estiver comunicado na página de preço. Egress zero que o cliente não vê é economia interna, não vantagem competitiva.

### Onde a concorrência resolve o mesmo fluxo com menos cliques

| Fluxo | Como o mercado faz | Cliques que economiza |
|---|---|---|
| Criar galeria | **Preset/template de galeria**: marca, senha, expiração, permissão de download e tamanho de download salvos como um perfil aplicado de uma vez. CloudSpot, Pixieset, Pic-Time. | 6 a 8 campos por galeria, toda vez |
| Upload | Arrastar a **pasta** direto na área de galerias: cria a galeria com o nome da pasta, define a primeira foto como capa e já devolve o link. Pic-Time, Pixieset, PicDrop. | Elimina o formulário de criação inteiro |
| Compartilhar | **Link existe antes de o upload terminar** — o fotógrafo copia e manda enquanto sobe. PicDrop. | Elimina a espera bloqueante |
| Cliente baixar tudo | Um botão "baixar tudo", ZIP servido do storage, e-mail com o link quando pronto para lote grande. Universal. | Elimina o download foto a foto |
| Seleção | Cliente marca com **um clique/duplo-clique na miniatura**, sem abrir a foto; contador de "N de 40 escolhidas" fixo na tela. EPICS, Picsize. | Reduz de 3 cliques por foto para 1 |
| Cobrar extra | Limite de fotos e preço por foto extra configurados na galeria, cobrança disparada sozinha ao passar do limite. Picsize, EPICS, FotoApp. | Elimina a negociação manual por WhatsApp |

### Padrão de mercado de preço por giga

Cálculo direto sobre os planos verificados (USD/GB/mês, faixa média de cada plataforma):

| Plataforma / plano | Preço | GB | **US$/GB/mês** |
|---|---|---|---|
| Zenfolio Basic | $9 | 15 | **0,60** |
| CloudSpot Entry | $7 | 15 | **0,47** |
| Pic-Time Professional | $25 | 100 | **0,25** |
| Pixieset Plus | $20 | 100 | **0,20** |
| CloudSpot Lite | $17 | 100 | **0,17** |
| Format Pro | $17 | 100 | **0,17** |
| CloudSpot Pro | $34 | 500 | **0,068** |
| Pixieset Pro | $50 | 1.024 | **0,049** |
| PicDrop Pro | €17,99 | 500 | **≈0,036** (mais barato) |
| Format Pro Plus | $26 | 1.024 | **0,025** |
| *Referência BR:* Snap Me Camera | R$49,90 | 60 | **R$0,83/GB** |
| *Referência consumidor:* Google One BR | R$9,99 | 100 | **R$0,10/GB** |
| **Custo de origem: Cloudflare R2** | $0,015/GB + egress $0 | — | **≈R$0,08/GB** |

Leitura:

1. **O padrão internacional é US$0,15 a US$0,25 por GB/mês nas faixas de 100GB**, caindo para US$0,03–0,07 nas faixas de 500GB–1TB. Abaixo de 100GB o preço por GB dispara (0,47 a 0,60) porque o plano de entrada está cobrando pelo acesso ao software, não pelo disco.
2. **"Ilimitado" é sempre US$50/mês** — Pixieset, Pic-Time, ShootProof, CloudSpot, todos no mesmo número. Esse é o teto psicológico do mercado. E "ilimitado" tem *fair use* em todos.
3. **O mercado brasileiro majoritário não vende GB — vende número de fotos.** EPICS (2.000 a 140.000 fotos), ShootProof, Go Gallery (300 a 100.000 imagens), Picsize (volume de arquivos). Isso não é acaso: o fotógrafo sabe que entregou 800 fotos do casamento, não sabe que isso deu 14GB. **Se o Foto Drive vende por GB, está criando fricção de venda contra todo o hábito do mercado local.** A recomendação é vender por fotos na vitrine e controlar por GB no backend, com uma conversão declarada (ex.: "1.000 fotos ≈ 20GB").
4. **Onde o Foto Drive se encaixa:** com custo de origem de ≈R$0,08/GB e egress zero, o ponto de equilíbrio agressivo é **R$0,40 a R$0,60 por GB/mês**, o que ainda dá 5x a 7x de margem bruta sobre o storage. Isso o coloca **abaixo do Snap Me Camera (R$0,83/GB) e muito abaixo dos gringos convertidos**, com espaço para um plano ilimitado a R$149–199/mês que ninguém no Brasil consegue bancar em S3.

### Diferencial real vs. discurso de marketing

**Real (o cliente sente e não consegue no concorrente):**
- Egress zero traduzido em download ilimitado e galeria que não expira por custo.
- Pix e cobrança em real, sem IOF e sem recusa de cartão internacional.
- Suporte em português no fuso horário do Brasil, com gente que entende "prova de álbum" e "seleção de 40".
- Nota fiscal brasileira, dado sob LGPD.
- Integração com laboratório/encadernadora nacional (a Go Image tem isso e nenhum gringo tem).
- Separação automática dos arquivos selecionados no computador do fotógrafo (EPICS faz; é economia de tempo mensurável).

**Discurso (todo mundo diz e ninguém diferencia):**
- "Galerias lindas", "experiência premium", "slides cinematográficos" — todos dizem, e o cliente final não escolhe fornecedor por isso.
- "Ilimitado" — sempre tem fair use no contrato.
- **"Anti-print" e "ofuscamento inteligente"** — isto é teatro de segurança. Print de tela do sistema operacional, foto do monitor com o celular e a aba de rede do navegador derrubam qualquer uma dessas proteções em segundos. Vender isso como segurança é criar expectativa que você não pode cumprir. Se o Foto Drive for por esse caminho, é passivo, não recurso.
- "IA" genérica sem função nomeada.
- "Upload rápido" — a rede do fotógrafo é o gargalo, não o seu servidor.

---

## PARTE 3 — RELATÓRIO

### A. Resumo em cinco linhas

1. O Foto Drive não foi testado: o ambiente desta auditoria não alcança a internet aberta, e a URL e as credenciais chegaram como placeholder — as seções B, C e D estão vazias e não serão preenchidas por dedução.
2. **O maior risco hoje não é um bug conhecido, é a ausência total de verificação**: um SaaS multi-tenant em Supabase + R2 entregando link público para cliente final tem duas falhas de isolamento clássicas (RLS ausente ou permissiva, e objeto do R2 servido por URL adivinhável sem assinatura) que vazam galeria de um fotógrafo para outro, e nenhuma das duas foi descartada.
3. O mercado brasileiro não compra "entrega de fotos" — compra **seleção e entrega**, com limite de escolhas e cobrança de foto extra; sem isso, o Foto Drive concorre com WeTransfer e não com EPICS, Picsize ou FotoApp.
4. O ativo estrutural mais valioso é o egress zero do R2, e ele hoje é economia interna invisível: só vira vantagem competitiva quando aparecer na página de preço como download ilimitado.
5. Vender por GB num mercado que compra por número de fotos é fricção comercial autoinfligida.

### B. FUNCIONA — o que foi testado e passou

**Nada.** Nenhum dos 20 itens foi executado. Ver seção 0.

### C. NÃO FUNCIONA

**Vazia.** Não há achado observado, porque não houve observação. Ver seção 0 para os motivos e a seção H para a lista completa do que ficou de fora.

Registrar qualquer coisa aqui a partir da stack seria fabricar achado — e num relatório de auditoria isso é pior do que a seção vazia.

### C′. Protocolo de teste pronto para execução

Executável em ~4 horas assim que houver URL, conta e rede. Cada linha já tem o critério de reprovação, então quem rodar não precisa julgar.

| # | Teste | Reprova se |
|---|---|---|
| 1 | Cadastro, login, recuperação de senha, logout | E-mail de recuperação não chega em 2 min; link de recuperação funciona duas vezes; logout não invalida a sessão em outra aba |
| 2 | Onboarding, cronômetro de 60s | Em 60s um fotógrafo novo não conseguiu criar a primeira galeria e copiar o link |
| 3 | Criar galeria com nome, capa, senha, expiração, marca | Qualquer campo obrigatório sem indicação; a marca não aparece na visão do cliente |
| 4a | Upload de 1 arquivo grande (>500MB) | Barra de progresso trava, volta atrás, ou chega a 100% antes do fim |
| 4b | Lote de 200+ arquivos | Falha parcial silenciosa; contagem final ≠ contagem enviada |
| 4c | Formato inválido (.txt renomeado para .jpg, .heic, .cr2) | Erro genérico sem dizer qual arquivo e por quê |
| 4d | Cancelar no meio | Arquivos parciais ficam na galeria ou contam no storage |
| 4e | **Fechar a aba durante o envio e voltar** | Recomeça do zero; ou duplica as fotos já enviadas |
| 5 | Renomear, reordenar, excluir, criar pasta, mover entre galerias | Reordenação não persiste após refresh; mover não existe |
| 6 | Link, senha, permissão de download | Alterar a senha não invalida a sessão de quem já entrou |
| 7 | **Painel: storage informado vs. soma real dos arquivos** | Divergência acima de 2%; miniaturas/derivados não contabilizados; lixeira não contabilizada |
| 8 | Link em aba anônima | Pede login; ou não pede a senha configurada |
| 9 | Ver, favoritar, baixar 1, baixar tudo | ZIP grande estoura timeout sem aviso; favorito não persiste sem login |
| 10 | Senha errada / link expirado / link adulterado | Mensagem genérica; ou senha errada revela que a galeria existe e quantas fotos tem |
| 11 | Celular, 360px de largura, 4G | Toolbar cobre a foto; ZIP não conclui; zoom quebrado |
| 12 | Admin: contas, uso, cobrança | Ação de admin sem log de auditoria; admin consegue apagar dado de tenant sem confirmação |
| **13** | **Trocar ID de galeria/tenant na URL da API e da UI** | **Retorna 200 com dado alheio → CRÍTICO** |
| **14** | **Colar a URL do R2 em aba anônima; remover o `?token`/assinatura; incrementar o nome do objeto** | **Arquivo abre sem autenticação → CRÍTICO** |
| **15** | **Galeria privada em `/rest/v1/` do Supabase com a anon key; sitemap; busca interna; `robots.txt`** | **Aparece em listagem ou resposta de API → CRÍTICO** |
| **16** | **Do link de cliente, tentar `/dashboard`, `/admin`, e chamar endpoint de fotógrafo com o token do cliente** | **Alcança qualquer rota de fotógrafo ou admin → CRÍTICO** |
| 17 | Nome vazio, 5.000 caracteres, `ção`, emoji, `"`, `'`, `/`, `\`, `../`, `<script>` | Quebra layout; nome de arquivo com `/` corrompe o caminho no R2; `../` escapa do prefixo do tenant |
| 18 | Duplo clique em criar/excluir; voltar do navegador no meio do fluxo; F5 durante upload | Duplo clique cria duas galerias ou cobra duas vezes |
| 19 | Estado vazio, carregamento, erro | **Qualquer "algo deu errado" ou "erro inesperado" é falha, por definição do escopo** |
| 20 | Revisão de todo o texto em PT-BR | "Upload", "bucket", "storage", "tenant" na tela do cliente final; termo diferente para a mesma coisa em telas diferentes |

### C″. Matriz de risco arquitetural — Supabase + R2 multi-tenant

Hipóteses de alta probabilidade a priori nesta stack específica. **Não são achados.** São onde procurar primeiro, ordenadas por dano.

| Risco | Por que é provável nesta stack | Como confirmar em 5 minutos |
|---|---|---|
| **RLS desligada ou permissiva em alguma tabela** | Supabase deixa `RLS` desabilitada por padrão em tabela criada por migration; basta uma tabela esquecida (`gallery_photos`, `favorites`, `share_links`) para vazar tudo | Com a anon key, `select` direto em cada tabela via PostgREST |
| **Policy escrita com `USING (true)`** | Atalho comum durante o desenvolvimento que nunca é revisto | Ler as policies; qualquer `true` sem `auth.uid()` é vazamento |
| **Objeto do R2 acessível por URL pública** | R2 com domínio público conectado serve tudo que está no bucket; se o app monta a URL em vez de assinar, o link vale para sempre e para qualquer um | Abrir a URL da foto em aba anônima, sem cookie |
| **Chave do objeto adivinhável** (`/galeria-1/foto-001.jpg`) | Sem UUID no caminho, enumerar galeria alheia é trivial | Incrementar o número no caminho |
| **URL assinada com validade longa demais** | Assinar por 7 dias "para o cliente não reclamar" transforma o link em acesso permanente e compartilhável | Ler o `X-Amz-Expires` |
| **Service role key no bundle do front** | React + Supabase: a chave certa é a anon; a service role vaza no bundle e ignora toda a RLS | `grep -i "service_role\|eyJ" ` no JS servido |
| **Contagem de storage no cliente** | Se o front soma o tamanho enviado, cancelamento e falha desandam o número — e o cliente paga por GB que não existe | Comparar o painel com a soma real no bucket |
| **Senha da galeria validada no front** | Se a senha é comparada em JavaScript, ela está no bundle e a galeria é pública | Ver a resposta da API antes de digitar a senha |

### D. INCOMODA

**Vazia.** Depende de uso real do produto.

### E. COMPARATIVO

Nas tabelas E.1 e E.2 acima. A coluna do Foto Drive está deliberadamente ausente: preenchê-la exigiria a Parte 1.

### F. LACUNAS — o que falta para competir de igual para igual

Prioridade decrescente. Confirmar cada uma contra o produto real antes de tratar como pendência.

1. **Seleção de fotos pelo cliente, com limite e cobrança de extras.** É a mesa de entrada do mercado brasileiro. Sem isso o produto não está na mesma categoria dos concorrentes locais.
2. **Cobrança em BRL com Pix**, com repasse automático ao fotógrafo (padrão FotoApp).
3. **Preset de galeria** — marca, senha, expiração e permissão de download aplicados de uma vez.
4. **Marca d'água automática no upload.**
5. **Aprovação de álbum.**
6. **Loja de extras com margem definida pelo fotógrafo**, ou integração com laboratório nacional.
7. **Analytics de galeria + captura de e-mail do visitante** — é o que transforma entrega em canal de venda.
8. **App/PWA com "salvar na galeria do celular"** — o cliente final abre no celular, não no desktop.
9. **Expiração com aviso e arquivamento automático** que efetivamente reduz o storage cobrado.
10. **Multi-marca** para estúdio com mais de uma marca.
11. **Site/portfólio incluso**, mesmo que simples — Pixieset, Zenfolio, EPICS, Picsize e FotoApp usam isso para justificar preço.
12. **Plano gratuito de verdade** como funil, com o teto na quantidade e não no recurso.

### G. PRIORIDADES — dez ações por impacto sobre esforço

| # | Ação | Por quê |
|---|---|---|
| 1 | **Rodar os itens 13 a 16 do protocolo hoje** (isolamento entre tenants e exposição do R2) | São 30 minutos de trabalho e é o único risco da lista que pode acabar com a empresa em vez de só atrapalhá-la |
| 2 | **Auditar RLS tabela por tabela e assinar toda URL do R2 com validade curta** | Consequência direta do item 1; é a correção que não dá para adiar |
| 3 | **Liberar o domínio do Foto Drive na política de egress ou anexar o repositório** | Sem isso nenhuma auditoria acontece, incluindo esta; é bloqueio de processo, não de produto |
| 4 | **Conferir o número de storage do painel contra a soma real do bucket** | Se o número que fatura o cliente está errado, é erro de cobrança, não de UI |
| 5 | **Testar fechar a aba durante o upload** (item 4e) | É a falha que mais gera cancelamento em produto de entrega de foto, e a que menos aparece em teste de mesa |
| 6 | **Implementar seleção com limite e cobrança de extras** | Maior lacuna competitiva; sem ela o produto está na categoria errada |
| 7 | **Pix com repasse automático** | Barreira que o bloco internacional inteiro não consegue atravessar; é onde o produto ganha por ser brasileiro |
| 8 | **Trocar a vitrine de GB para número de fotos** (mantendo GB no backend) | Alinha ao hábito de compra do mercado local; é mudança de copy e de tabela, não de arquitetura |
| 9 | **Transformar o egress zero em oferta explícita: download ilimitado** | Ativo que já existe e não está sendo cobrado nem comunicado; custo marginal zero |
| 10 | **Eliminar todo "algo deu errado" e revisar o PT-BR das telas do cliente final** | Barato, e é o texto que o cliente do seu cliente lê — erro aqui queima a marca do fotógrafo, não a sua |

### H. NÃO CONSEGUI TESTAR

| O que | Por quê |
|---|---|
| **Parte 1 inteira — os 20 itens**, fluxo do fotógrafo, do cliente final e do admin, segurança, isolamento, casos limite, mobile | Sem URL (`[COLAR]`), sem credenciais (`[COLAR EMAIL E SENHA]`) e **sem rede**: o proxy de egress recusa todo host fora da allowlist (403 no CONNECT), o que inutiliza também o Chromium/Playwright instalados |
| **Auditoria estática do código** como alternativa | O repositório da sessão está vazio (zero commits) e não há repositório do Foto Drive acessível na conta |
| **Preço exato de Picsize, Zakar, FotoApp, Fotoo.pro, Snap Gallery, Go Prime e Exposure** | Todos os domínios `.com.br` bloqueados pelo mesmo proxy; os snippets de busca não trazem os valores |
| **Confirmação de meio de pagamento** dos concorrentes internacionais para cliente brasileiro | Exige checkout real, que não foi feito |
| **Verificação das duas inconsistências de fonte** (Pixieset Pro/Ultimate no mesmo preço; Google One 200GB e 2TB no mesmo preço) | Páginas oficiais bloqueadas |

---

## O que eu preciso para rodar a Parte 1

1. **Liberar o domínio do Foto Drive na política de egress do ambiente** — ou me dizer para rodar isto num ambiente com rede aberta. Este é o item que trava tudo.
2. **URL** do ambiente a auditar (produção ou staging — diga qual, porque muda o que é seguro testar).
3. **Credenciais da conta de teste do fotógrafo.**
4. *(Opcional, alto retorno)* **Anexar o repositório do código.** Com o código eu cubro os itens 13 a 16 — RLS, assinatura de URL do R2, vazamento de chave — com muito mais profundidade do que por fora, e antes mesmo de a rede ser liberada.

Com 1, 2 e 3, as seções B, C e D saem em cerca de 4 horas de execução.

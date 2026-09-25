# Auditoria da Área de Membros

Data: 25/09/2026. Escopo: o app inteiro, do começo ao fim. Funcionamento, regras de acesso, segurança, design e texto.

Correções enviadas no branch `claude/dazzling-ptolemy-4j4kpz` do repositório `Faresrames/area-membros`.

---

## 1. Como foi testado

A auditoria não ficou só na leitura do código. Montei um Supabase completo nesta máquina: Postgres 16 com as 45 migrations, o mesmo login do Supabase (GoTrue, com código de app autenticador), a mesma API (PostgREST) e as 30 edge functions rodando em Deno. O R2, o Resend e o Asaas foram trocados por imitações locais que **registram** o que seria enviado. O app rodou num Chromium de verdade, controlado passo a passo, com captura de tela de cada etapa, no computador (1440px), no celular (390px) e nos temas escuro e claro.

Cenário criado:

| Quem | Como foi criado | Regra |
|---|---|---|
| Admin | Senha + código do app autenticador (QR na primeira vez) | Painel |
| Ana | Tela "Novo aluno" | Acesso total ao Curso A |
| Gabi | Function do painel | Gradual: começa com 2, mais 1 a cada 7 dias |
| Mario | Function do painel | Só os módulos 1 e 3 |
| Beto | Criado e depois **bloqueado pela tela** | Bloqueado |
| Vera | Function do painel | Prazo vencido ontem |
| Tito | Function do painel | Teste grátis de 3 dias |
| João | **Compra pelo webhook do Asaas** | Compra do Curso B, depois reembolso |

Conteúdo: Curso A com uma sessão e 4 módulos. Aulas publicadas, uma em rascunho, uma agendada, uma que já saiu do ar, e um módulo inteiro agendado. Curso B à venda na vitrine, com preço e link de compra. A primeira aula foi criada inteira pela tela: capa, módulo com capa, aula, envio do vídeo com barra de progresso, miniatura tirada do vídeo, publicação com "Avisar os alunos? Sim".

---

## 2. O que funciona (verificado, não suposto)

**Acesso: está certo no banco, não só na tela.** Cada aluno fez login e chamou a API direto, sem passar pela tela:

| Aluno | Aulas que a API devolve | Link do vídeo de aula que não é dele |
|---|---|---|
| Ana (total) | as 5 no ar. Rascunho, agendada, fora do ar e módulo agendado **não vêm** | recusado |
| Beto (bloqueado) | 0 | recusado |
| Vera (vencida) | 0 | recusado |
| Gabi (gradual) | 2 | recusado |
| Mario (módulos 1 e 3) | as 3 dos módulos dele | recusado |
| Tito (teste grátis) | as 5 | liberado (certo) |
| Admin só com senha, sem o código | 0 matrículas, functions dizem "não autorizado" | n/a |

Tentativas de burla, todas **barradas pelo banco**: aluna se matricular sozinha num curso, marcar como concluída aula de curso que não tem, se inserir na tabela de admins, ler o perfil (nome e WhatsApp) de outros alunos, chamar function de admin.

**Bloqueio ao vivo:** bloqueei a Ana enquanto ela assistia. Ao recarregar, ela vê "Seu acesso está pausado" e o curso some da Home. Limitação já documentada: o vídeo que já estava aberto continua tocando até o link vencer (até 2h).

**Vendas:** compra aprovada cria a conta, libera o curso e manda o email com login e senha. O mesmo aviso repetido pelo Asaas não duplica nada. Reembolso bloqueia **só aquela compra**. A compra de outro curso não desbloqueia o curso que você bloqueou à mão. Produto desconhecido fica anotado como ignorado. Sem a chave, recusa (401).

**Também funcionam:** tempo assistido contado pelo servidor (pular o vídeo não conta); marca d'água com o email; vitrine com "Ver detalhes" e "Adquirir" levando ao link certo; suporte completo (aluno manda, você responde, ele recebe o email); busca respeitando o acesso (Mario não acha aula do módulo que não tem); email de acesso ao criar aluno; certificado bloqueado até 100%; sem rolagem lateral no celular; os 14 testes de banco do projeto; os 40 testes das functions; build e checagem de tipos.

---

## 3. Corrigido nesta auditoria

### 3.1 GRAVE: a aula concluída ia para a aula errada
**O que acontecia:** a Ana assistiu a Aula 2.1 inteira. O sistema marcou a **2.2** como concluída, e depois a **3.1**, com só 14 segundos vistos de 30. A aula realmente assistida ficou sem a marca.
**Por quê:** quando o vídeo acaba, o app já pula para a próxima aula. A resposta do servidor ("essa aula foi assistida") chega um instante depois e era aplicada à aula que estava na tela, ou seja, a próxima.
**Efeito real:** progresso, "Aulas assistidas" do painel, relatórios e metas de recompensa estavam errados para quem deixa o vídeo terminar.
**Correção:** o player guarda de qual aula era cada envio. **Testado de novo no navegador:** Ana assiste a 2.1 até o fim, a 2.1 fica concluída, a 2.2 não.
Dados antigos: o que já foi marcado errado continua no banco. Dá pra recalcular a partir do tempo assistido guardado (`estudo_aulas`). Não fiz isso sem você pedir.

### 3.2 Gradual: uma semana perdida por aula que saiu do ar
A fila do gradual contava aulas que já saíram do ar e nunca voltam. A Gabi (1 aula a cada 7 dias) via a Aula 3.1 "libera em 23/10" em vez de 16/10: esperava uma semana por uma aula invisível. **Correção (migration 046):** aula fora do ar não ocupa lugar na fila. Isso só adianta aulas, nunca tranca. Para a única situação que poderia trancar (você tirar a data de saída de uma aula e ela voltar pra fila), o gatilho agora registra antes o que cada aluno já tem liberado. Teste novo `046_teste.sql` cobre os dois casos (8/8).

### 3.3 Segurança: duas funções não barravam quando a chamada vinha sem papel
`historico_do_aluno` e `ia_consumo` checavam `auth.role() = 'service_role'`, que vira NULL quando a chamada não traz papel, e o NULL passava pela trava. Pelo app o papel sempre vem, então não havia vazamento, mas a regra não pode depender disso. O próprio teste do projeto (`037`, caso 12) acusava a falha. Corrigido na 046; agora o 037 passa.

### 3.4 Hover dos cards (a sua reclamação)
Confirmado com captura antes e depois: o card cresce e ganha um anel branco, mas a faixa do carrossel corta tudo que passa da borda dela. Por isso a borda esquerda e o anel ficavam "tampados". Agora a faixa tem folga e o card aparece inteiro.

### 3.5 Recolher módulos no painel (a sua reclamação)
Confirmado: com "Minimizar tudo", cada módulo continuava um cartão de uns 72px, com capa, botões e bordas. Quatro módulos fechados ocupavam quase a tela inteira. Agora o módulo fechado vira uma linha fina, com nome e contagem lado a lado.

### 3.6 Outros ajustes
- Miniatura de curso e módulo no painel mostrava o nome escrito por cima ("Mó 1..."), ilegível em 32px. Agora mostra só a imagem.
- O botão de ação do topo ("Criar curso", "Ver como aluno") ficava na borda da janela, fora da coluna do conteúdo. Agora fica alinhado.
- Aula de módulo agendado aparecia como "Publicada" no painel, mas o aluno não a vê. Agora o selo diz "Com o módulo, em dd/mm".
- Vídeo cuja duração o navegador não consegue ler (WebM gravado de tela, alguns MOV) ficava sem duração, calado. Assim ele não conta em "% assistido", recompensas e certificado. Agora a tela avisa e deixa digitar a duração.
- "Esqueci minha senha" sem WhatsApp configurado mandava falar com o suporte sem mostrar contato nenhum, um beco sem saída. Agora mostra também o email de suporte, e Configurações avisa quando os dois estão vazios.
- Três respostas do FAQ que não batiam com o app (botão "Detalhes" que se chama "Ver detalhes", anel de progresso "nos cartões" que não existe, WhatsApp prometido sem estar configurado). Só é trocado o texto que ainda estiver como veio; o que você editou fica.
- Relatórios mostravam "Horas assistidas: 0" para quem viu minutos. Agora mostram "18 min", "1h 05min".
- O aviso de aula nova usava travessão ("Módulo — Aula"), que o DESIGN.md proíbe. Agora é "Módulo · Aula".
- README: WhatsApp aparecia como opcional (é obrigatório); dizia que o aluno troca a senha em Meu perfil (não troca); o comando de teste das functions falhava; a lista de migrations parava na 042.

---

## 4. Decisões que são suas (não mudei)

1. **Aluno de "Só alguns módulos" nunca chega a 100%.** O Mario (módulos 1 e 3) vê "0/5 aulas": os módulos que ele não comprou entram na conta. O máximo possível para ele é 60%, e o **certificado fica impossível**. O card do módulo que ele não tem diz "Ainda não liberada", como se fosse liberar. Minha recomendação: nesse modo, contar só os módulos dele e escrever "Não incluso no seu acesso".
2. **Recalcular o progresso antigo** marcado errado pelo bug 3.1 (a partir do tempo assistido). É um script de uma vez só.
3. **O certificado é montado só no navegador**, sem código de verificação. Qualquer pessoa consegue "imprimir" um. Se o certificado vale algo pra você, ele precisa de um link de validação.

---

## 5. Encontrado e ainda não corrigido (design e detalhes)

| Onde | O quê |
|---|---|
| Painel, Conteúdo | Botões repetidos: "Novo módulo" no topo e em cada sessão; "Nova aula", "+" e "Adicionar aula neste módulo"; "Criar sessão" e "Nova sessão" |
| Painel, Conteúdo | "Minimizar tudo" não recolhe as sessões; o aviso grande do gradual fica fixo no topo |
| Painel, curso | O link "Todos os cursos" fica abaixo do título (o normal é em cima, como caminho) |
| Painel, aluno | Janela com 6 botões soltos; "Remover aluno" (perigoso) colado em "Ver ficha"; o foco inicial cai em "Trocar foto" |
| Painel, alunos | Aluno em teste grátis aparece como "Acesso total · Até 28/09", sem dizer "Teste grátis" |
| Painel, Novo aluno | O campo Foto é o seletor de arquivo cru do navegador ("Choose File / No file chosen") |
| Painel, aula | O aviso "Vídeo enviado" no canto cobre os controles do player; a barra do editor de texto usa letras soltas (T B I S · 1.) em vez de ícones |
| Painel, Vendas | Com vendas num dia só, o gráfico vira um bloco roxo do tamanho da tela; compra reembolsada aparece como "Sem identificação" |
| Painel, Recompensas | O conteúdo fica só na metade esquerda da tela |
| Painel, Painel | O cartão "Alunos" tem borda roxa sem motivo; o menu lateral é azulado e destoa do fundo preto |
| Aluno, Home | O destaque do topo usa a capa **em pé** esticada na largura toda (fica borrada). Falta um campo de banner deitado |
| Aluno, Home | As setas do carrossel quase não aparecem (escuro sobre escuro); "0/5 aulas" fica longe do título |
| Aluno, aula | Dois botões de tela cheia (o nosso e o do navegador); duas setas de anterior/próxima (no vídeo e ao lado das estrelas) |
| Aluno, suporte | O painel de ajuda mostra só 6 das 11 perguntas; a dúvida digitada se perde ao ir para "Enviar mensagem aqui no app" |
| Aluno, geral | A tela de perfil pede a foto que não existe e registra um erro 404 no console a cada página |
| Código | Vídeo salvo sempre como `original.mp4`, mesmo sendo WebM ou MOV; `aulas.publicada` nasce `true` por padrão no banco (hoje a tela sempre manda `false`, mas outro caminho publicaria sem querer) |

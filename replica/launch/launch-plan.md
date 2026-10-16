# Plano de lançamento do Farol

## Antes de abrir (bloqueia)

- [ ] Contas e chaves: Supabase, Cloudflare R2, Resend, Asaas (`replica/backend.md`) e teste de cada um com dados reais.
- [ ] Nome: INPI (classes 9 e 42) e domínio no registro.br (`replica/brand.md`). Advogado de marcas antes de gastar com o nome.
- [ ] Razão social, CNPJ e e-mail de contato nas páginas legais; revisão das páginas com advogado (LGPD).
- [ ] Logo final e imagem social (briefing em `replica/brand.md`).
- [ ] Monitoramento: erros (Sentry, plano grátis) e uptime da página do cliente (Better Stack ou UptimeRobot), com alerta no seu celular.
- [ ] Analytics sem cookie de publicidade (Plausible ou Umami): dispensa banner de cookies.

## Beta fechado (2–4 semanas)

- **Os 10 primeiros, falados um a um:** fotógrafos de casamento da sua rede (colegas, segundo fotógrafo, quem você indica e
  quem te indica). Critério: fazem pelo menos 2 casamentos por mês e usam algum sistema de seleção hoje.
- Proposta: plano Temporada grátis por 3 meses em troca de 1 casamento real no Farol e uma conversa de 20 minutos depois.
- O que medir: o cliente final conseguiu escolher sem pedir ajuda? Quanto tempo do link à seleção? Alguma galeria falhou?
- Depoimentos **só** desses fotógrafos, com autorização por escrito. Até lá, a página fica sem seção de prova.

## Onde estão os fotógrafos insatisfeitos

- Grupos de fotógrafos de casamento no Facebook, WhatsApp e Telegram (pergunta aberta: "o que te irrita no seu sistema de seleção?").
- Instagram e Threads de fotógrafos (o post de quem trocou Alboom → 46graus → Picsize mostra que se fala disso em público).
- Reclame Aqui: não abordar quem reclamou (é pesquisa, não lista de contato).
- Seu próprio conteúdo: você já faz vídeo sobre fotografia de casamento. Uma série "como meu cliente escolhe as fotos" mostrando
  o Farol de verdade, no seu trabalho, vale mais que anúncio. (A skill `adaptar-roteiro-fotografia` pode ajudar nos roteiros.)

## Anúncio de lançamento

- Não Product Hunt / Hacker News (público errado). Para o Brasil: post e vídeo nos seus canais + grupos.
- Liderar pela correção, não pela lista de recursos: "O dia em que o noivo abre o link é o pior dia para o sistema falhar. Fiz o
  Farol para esse dia dar certo." Mostrar o fluxo real no celular.
- Nunca citar Select ou concorrentes pelo nome em anúncio (comparação com nomes: advogado antes).

## Depois do lançamento (30 dias)

- Ligar para cada um dos primeiros 10 pagantes.
- Construir as correções que faltam de `replica/fixes.md`: página de status, fila offline, entrega automática, suporte com prazo.
- Rodar de novo a pesquisa (`/replica-entrepreneur`) com mais fontes e as conversas do beta.

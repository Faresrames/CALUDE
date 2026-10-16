import type { Metadata } from "next";
import { LegalPage } from "@/components/app/LegalPage";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Política de privacidade" };

// RASCUNHO: revisar com advogado antes do lançamento (LGPD, Lei 13.709/2018).
export default function Privacidade() {
  const b = BRAND;
  return (
    <LegalPage title="Política de privacidade" updated="16/10/2026">
      <p>
        Esta política explica quais dados o {b.name} trata, para quê e com quem compartilha. O {b.name} é operado por {b.legalName},
        CNPJ {b.cnpj}. Dúvidas e pedidos sobre seus dados: {b.supportEmail}.
      </p>

      <h2>Quem é responsável por quais dados</h2>
      <ul>
        <li><strong>Dados do fotógrafo</strong> (a conta): o {b.name} é o controlador.</li>
        <li>
          <strong>Dados dos clientes do fotógrafo</strong> (nome, e-mail, fotos, escolhas e comentários): o fotógrafo é o controlador
          e o {b.name} trata esses dados em nome dele, só para prestar o serviço.
        </li>
      </ul>

      <h2>Que dados tratamos</h2>
      <ul>
        <li>Fotógrafo: nome, nome do estúdio, e-mail, CPF ou CNPJ (para a cobrança), chave PIX (se cadastrada), logo da marca d’água.</li>
        <li>Cliente do fotógrafo: nome e e-mail informados pelo fotógrafo, fotos escolhidas, favoritas, comentários e a decisão sobre o álbum.</li>
        <li>Fotos: só prévias reduzidas (até 1600 px) com marca d’água e as lâminas do álbum. Os arquivos originais não são enviados.</li>
        <li>Dados técnicos: endereço IP e registros de acesso, usados para segurança (por exemplo, limitar tentativas de senha).</li>
      </ul>

      <h2>Para que usamos</h2>
      <ul>
        <li>Prestar o serviço contratado: galerias, seleção, álbum, avisos por e-mail (execução de contrato).</li>
        <li>Cobrar a assinatura (execução de contrato e obrigação legal).</li>
        <li>Proteger o serviço contra abuso e fraude (legítimo interesse).</li>
      </ul>
      <p>Não vendemos dados, não usamos as fotos para treinar inteligência artificial e não mostramos anúncios.</p>

      <h2>Com quem compartilhamos</h2>
      <p>Só com fornecedores necessários para o serviço funcionar, que tratam os dados conforme nossas instruções:</p>
      <ul>
        <li>Supabase: banco de dados e login.</li>
        <li>Cloudflare (R2): armazenamento das prévias das fotos e das lâminas.</li>
        <li>Vercel: hospedagem do site.</li>
        <li>Resend: envio de e-mails.</li>
        <li>Asaas: cobrança da assinatura do fotógrafo.</li>
      </ul>
      <p>
        Alguns desses fornecedores podem armazenar dados fora do Brasil. Quando isso acontece, a transferência segue as regras da LGPD.
        O pagamento das fotos extras é feito por PIX direto entre o cliente e o fotógrafo; o {b.name} não recebe esse dinheiro.
      </p>

      <h2>Cookies</h2>
      <p>Usamos apenas cookies necessários para manter você conectado e para lembrar que uma galeria com senha já foi aberta. Não usamos cookies de publicidade.</p>

      <h2>Por quanto tempo guardamos</h2>
      <ul>
        <li>Enquanto a conta do fotógrafo existir. Ao apagar a conta (em Configurações), apagamos dados, fotos e o acesso.</li>
        <li>Registros de cobrança: pelo prazo exigido pela lei fiscal.</li>
      </ul>

      <h2>Seus direitos</h2>
      <p>
        Você pode pedir acesso, correção, portabilidade ou exclusão dos seus dados, e saber com quem eles foram compartilhados (art. 18 da LGPD).
        Clientes de fotógrafos podem fazer o pedido ao próprio fotógrafo ou a nós, pelo {b.supportEmail}, e encaminharemos.
      </p>

      <h2>Mudanças</h2>
      <p>Se esta política mudar de forma importante, avisamos os fotógrafos por e-mail antes.</p>
    </LegalPage>
  );
}

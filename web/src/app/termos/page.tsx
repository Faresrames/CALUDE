import type { Metadata } from "next";
import { LegalPage } from "@/components/app/LegalPage";
import { PLANS, TRIAL_DAYS } from "@/lib/billing/plans";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Termos de uso" };

// RASCUNHO: revisar com advogado antes do lançamento.
export default function Termos() {
  const b = BRAND;
  return (
    <LegalPage title="Termos de uso" updated="16/10/2026">
      <p>
        Estes termos valem para quem cria uma conta no {b.name} (o fotógrafo). O serviço é prestado por {b.legalName}, CNPJ {b.cnpj}.
        Contato: {b.supportEmail}.
      </p>

      <h2>O serviço</h2>
      <p>
        O {b.name} permite enviar prévias de fotos para que os clientes do fotógrafo escolham, comentem e aprovem álbuns, e gera a lista
        das fotos escolhidas. Funcionalidades podem mudar; avisamos antes de retirar algo importante.
      </p>

      <h2>Teste, planos e cobrança</h2>
      <ul>
        <li>Teste grátis de {TRIAL_DAYS} dias, sem cartão.</li>
        <li>Planos mensais ou anuais com preço fixo e limite de fotos ativas ({PLANS.map((p) => p.name).join(", ")}). Não há créditos nem cobrança por foto.</li>
        <li>A cobrança é feita pelo Asaas, por PIX, boleto ou cartão. Se o pagamento atrasar, criar galerias novas fica bloqueado até a regularização; as galerias existentes continuam no ar.</li>
        <li>Cancelamento a qualquer momento, em um clique, sem multa. O acesso segue até o fim do período já pago. Não há reembolso proporcional do período em curso, exceto quando a lei exigir.</li>
      </ul>

      <h2>Responsabilidades do fotógrafo</h2>
      <ul>
        <li>Ter os direitos sobre as fotos enviadas e autorização dos clientes para tratar os dados deles no {b.name}.</li>
        <li>Manter o acesso à conta em segurança.</li>
        <li>Não usar o serviço para conteúdo ilegal, que viole direitos de terceiros ou para envio de spam.</li>
      </ul>

      <h2>Pagamento das fotos extras</h2>
      <p>
        O valor das fotos extras é pago pelo cliente diretamente ao fotógrafo, por PIX. O {b.name} só monta o código de pagamento e não
        participa dessa transação nem responde por ela.
      </p>

      <h2>Disponibilidade</h2>
      <p>
        Trabalhamos para o serviço ficar no ar o tempo todo e avisamos sobre manutenções programadas, mas não garantimos funcionamento
        ininterrupto. Em caso de falha, nossa responsabilidade se limita ao valor pago nos últimos 12 meses, salvo o que a lei não permitir limitar.
      </p>

      <h2>Encerramento</h2>
      <p>
        O fotógrafo pode apagar a conta a qualquer momento em Configurações; dados e fotos são apagados. Podemos encerrar contas que violem
        estes termos, com aviso prévio sempre que possível.
      </p>

      <h2>Lei e foro</h2>
      <p>Estes termos seguem a lei brasileira. Fica eleito o foro do domicílio do consumidor, quando aplicável.</p>
    </LegalPage>
  );
}

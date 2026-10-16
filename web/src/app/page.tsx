import { Check } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PLANS } from "@/lib/billing/plans";
import { BRAND } from "@/lib/brand";
import { formatBRL } from "@/lib/format";
import celular from "../../public/landing/celular-selecao.png";

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name} · Seleção de fotos para fotógrafos de casamento` },
  description: "Seu cliente escolhe as fotos pelo celular, sem instalar nada. Cada toque fica salvo. Você recebe a lista pronta para o Lightroom.",
};

const cta = "inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 text-base font-semibold text-on-accent hover:bg-accent-hover";

const steps = [
  ["Suba as fotos", "Arraste o evento inteiro. O Farol reduz as fotos e aplica a sua marca d’água antes de saírem do seu computador. Os originais ficam com você."],
  ["Mande o link", "Seu cliente abre no celular, sem instalar nada e sem criar conta. Senha opcional, prazo com horário claro e lembretes automáticos."],
  ["Receba a seleção", "Chega um e-mail quando o cliente termina. A lista sai pronta para colar no filtro do Lightroom, e as fotos extras são pagas por PIX direto para você."],
];

const features = [
  ["Feito para o celular do noivo", "Grade leve, sem instalar nada, e cada toque salvo na hora. Se a internet cair, o Farol avisa e o que já foi marcado não se perde."],
  ["Preço fixo, sem créditos", "Um valor por mês ou por ano, sem cobrança por foto nem crédito que some. Cancela em um clique, sem multa."],
  ["PIX das extras direto para você", "O cliente vê o QR Code com o valor certo. O dinheiro cai na sua conta, sem passar pela plataforma."],
  ["Avisa antes de virar problema", "Lembrete ao cliente três dias antes e no último dia. Você fica sabendo quando a seleção chega e quando o prazo vence."],
  ["Aprovação do álbum no mesmo lugar", "O cliente toca num ponto da página e comenta ali. Cada versão fica registrada até a aprovação final."],
  ["Com a sua marca", "Seu logo como marca d’água, em diagonal, no centro ou no canto. A galeria mostra o nome do seu estúdio."],
];

const faq = [
  ["Meu cliente precisa instalar algum app ou criar conta?", "Não. Ele abre o link no navegador do celular ou do computador. Se você quiser, coloca uma senha."],
  ["E se a internet do cliente cair no meio da seleção?", "Cada foto marcada é salva na hora. Se a conexão cair, o Farol avisa que aquele toque não foi salvo, e tudo o que já tinha sido marcado continua lá."],
  ["Minhas fotos originais vão para a internet?", "Não. Só sobem prévias de até 1600 px, já com a sua marca d’água. Os originais ficam no seu computador."],
  ["Como recebo pelas fotos extras?", "Por PIX, na chave que você cadastrar. O Farol monta o QR Code com o valor; o dinheiro vai direto para você, e você confirma no painel quando cair."],
  ["Funciona com o Lightroom?", "Sim. A lista das fotos escolhidas sai pronta para colar no filtro de nome do arquivo, e também dá para baixar em planilha."],
  ["Dá para trazer meus clientes do sistema que uso hoje?", "Ainda não importamos de outros sistemas. Criar uma galeria nova leva poucos minutos, e você pode baixar tudo do Farol quando quiser."],
  ["Posso cancelar quando quiser?", "Sim, em um clique, sem multa. Você continua usando até o fim do período já pago."],
];

export default function Home() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-content items-center justify-between px-4 py-5">
        <span className="font-display text-xl text-ink">{BRAND.name}</span>
        <Link href="/entrar" className="text-sm font-semibold text-ink underline-offset-4 hover:underline">Entrar</Link>
      </header>

      <main>
        <section className="mx-auto grid max-w-content items-center gap-10 px-4 pb-16 pt-6 md:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-5">
            <h1 className="font-display text-display text-ink md:text-[3.25rem] md:leading-[1.1]">
              A seleção de fotos que não falha no dia que importa.
            </h1>
            <p className="text-lg text-muted">
              Para fotógrafos de casamento: seu cliente escolhe as fotos pelo celular, sem instalar nada. Cada toque fica salvo. Você recebe a lista pronta para o Lightroom.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/entrar" className={cta}>Testar 14 dias grátis</Link>
              <span className="text-sm text-muted">Sem cartão de crédito.</span>
            </div>
          </div>
          <Image src={celular} alt="A galeria do cliente no celular: fotos marcadas, contador do pacote e o botão de revisar e enviar"
            priority className="mx-auto w-full max-w-xs rounded-lg border border-line shadow-pop" />
        </section>

        <section aria-labelledby="problema" className="bg-accent text-on-accent">
          <div className="mx-auto flex max-w-content flex-col gap-4 px-4 py-14">
            <h2 id="problema" className="font-display text-xl">O pior momento para um sistema falhar é quando o noivo abre o link.</h2>
            <p className="max-w-3xl text-on-accent/85">
              Galeria que não abre, cliente que não consegue marcar as fotos, cobrança de crédito com o sistema travado.
              Quem paga a conta é você, na frente do seu cliente. O Farol foi feito para esse dia dar certo.
            </p>
          </div>
        </section>

        <section aria-labelledby="como" className="mx-auto flex max-w-content flex-col gap-8 px-4 py-16">
          <h2 id="como" className="font-display text-xl text-ink">Como funciona</h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map(([t, d], i) => (
              <li key={t} className="flex flex-col gap-2 rounded-lg border border-line bg-raised p-5">
                <span className="grid size-8 place-items-center rounded-pill bg-accent text-sm font-semibold text-on-accent">{i + 1}</span>
                <h3 className="font-semibold text-ink">{t}</h3>
                <p className="text-sm text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="recursos" className="bg-surface">
          <div className="mx-auto flex max-w-content flex-col gap-8 px-4 py-16">
            <h2 id="recursos" className="font-display text-xl text-ink">O que muda no seu dia</h2>
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map(([t, d]) => (
                <li key={t} className="flex flex-col gap-2">
                  <h3 className="flex items-center gap-2 font-semibold text-ink"><Check aria-hidden className="size-4 text-selected" />{t}</h3>
                  <p className="text-sm text-muted">{d}</p>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted">
              E o básico de toda seleção: pacote com fotos extras, favoritas, comentários por foto, prazo que trava a galeria, galeria com senha.
            </p>
          </div>
        </section>

        <section aria-labelledby="precos" className="mx-auto flex max-w-content flex-col gap-8 px-4 py-16">
          <div>
            <h2 id="precos" className="font-display text-xl text-ink">Preço fixo. Sem créditos.</h2>
            <p className="text-muted">14 dias grátis com tudo liberado. No plano anual, você paga 10 meses e usa 12.</p>
          </div>
          <ul className="grid gap-4 md:grid-cols-3">
            {PLANS.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 rounded-lg border border-line bg-raised p-5 shadow-card">
                <h3 className="font-semibold text-ink">{p.name}</h3>
                <p className="text-sm text-muted">{p.forWho}</p>
                <p className="font-display text-xl text-ink">{formatBRL(p.monthlyCents)}<span className="text-sm text-muted">/mês</span></p>
                <p className="text-sm text-muted">ou {formatBRL(p.yearlyCents)}/ano</p>
                <p className="text-sm text-ink">{p.photos.toLocaleString("pt-BR")} fotos ativas</p>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">Todos os planos têm tudo: álbum, PIX das extras, lembretes, marca d’água com logo. Muda só quantas fotos ficam no ar ao mesmo tempo. Pagamento por PIX, boleto ou cartão.</p>
        </section>

        <section aria-labelledby="duvidas" className="bg-surface">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-16">
            <h2 id="duvidas" className="font-display text-xl text-ink">Dúvidas</h2>
            {faq.map(([q, a]) => (
              <details key={q} className="rounded-lg border border-line bg-raised p-4">
                <summary className="cursor-pointer font-semibold text-ink">{q}</summary>
                <p className="mt-2 text-sm text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto flex max-w-content flex-col items-center gap-4 px-4 py-20 text-center">
          <h2 className="font-display text-xl text-ink">Sua próxima galeria pode ser a primeira no Farol.</h2>
          <Link href="/entrar" className={cta}>Testar 14 dias grátis</Link>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted">
          <span>© {new Date().getFullYear()} {BRAND.name}</span>
          <nav aria-label="Rodapé" className="flex gap-4">
            <Link href="/privacidade" className="hover:text-ink hover:underline">Privacidade</Link>
            <Link href="/termos" className="hover:text-ink hover:underline">Termos de uso</Link>
            <Link href="/entrar" className="hover:text-ink hover:underline">Entrar</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

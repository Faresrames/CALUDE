import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PixPanel } from "@/components/ui/PixPanel";
import { clientGallery } from "@/lib/api";
import { data } from "@/lib/data";
import { pixPayload, pixQrSvg } from "@/lib/pix";

export const metadata: Metadata = { title: "Pagamento das fotos extras", robots: { index: false } };

/** S15: PIX das fotos extras, direto para a chave do fotógrafo. */
export default async function PagamentoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const g = await clientGallery(token);
  if (!g) notFound();
  const [order, p] = await Promise.all([data.getOrderForGallery(g.id), data.getPhotographer(g.photographerId)]);
  const studio = p?.businessName ?? p?.name ?? "o fotógrafo";

  let content: React.ReactNode;
  if (!order) {
    content = <p className="text-muted">Não há fotos extras para pagar nesta galeria.</p>;
  } else if (order.status !== "pending" || !p?.pixKey) {
    content = (
      <>
        <PixPanel amountCents={order.amountCents} extras={order.extrasCount} payload="" photographerName={studio}
          status={order.status === "paid" ? "paid" : order.status === "expired" ? "expired" : "pending"} />
        {order.status === "pending" && (
          <p className="text-sm text-muted">{studio} ainda não cadastrou uma chave PIX. Ele vai mandar os dados de pagamento por mensagem.</p>
        )}
      </>
    );
  } else {
    const payload = pixPayload({
      key: p.pixKey, name: p.pixMerchantName ?? studio, city: p.pixMerchantCity ?? "", amountCents: order.amountCents,
      txid: order.id.replace(/-/g, "").slice(0, 25), description: "Fotos extras",
    });
    const svg = await pixQrSvg(payload);
    content = (
      <PixPanel amountCents={order.amountCents} extras={order.extrasCount} payload={payload} status="pending" photographerName={studio}
        qrSrc={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`} />
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-10">
      <Link href={`/g/${token}`} className="text-sm text-muted hover:text-ink hover:underline">← Voltar para as fotos</Link>
      <h1 className="font-display text-xl text-ink">Fotos extras</h1>
      {content}
    </main>
  );
}

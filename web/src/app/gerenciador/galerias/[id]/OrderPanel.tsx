"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatBRL } from "@/lib/format";

/** Pedido das extras: o fotógrafo confirma quando o PIX cai. */
export function OrderPanel({ id, extras, amountCents, status, hasPixKey }: {
  id: string; extras: number; amountCents: number; status: "pending" | "paid" | "expired" | "canceled" | "refunded"; hasPixKey: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const label = status === "paid" ? "Pago" : status === "expired" ? "PIX expirado (sem confirmação em 72h)" : "Aguardando pagamento";
  return (
    <section aria-labelledby="order-t" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-raised p-5">
      <div>
        <h2 id="order-t" className="text-lg font-semibold text-ink">Fotos extras: {extras} · {formatBRL(amountCents)}</h2>
        <p className={status === "paid" ? "text-sm text-success" : "text-sm text-warning"}>{label}</p>
        {!hasPixKey && status !== "paid" && (
          <p className="text-sm text-muted">Cadastre sua chave PIX em Configurações para o cliente ver o QR Code.</p>
        )}
      </div>
      {status !== "paid" && (
        <Button variant="secondary" loading={busy} onClick={async () => {
          setBusy(true);
          const res = await fetch(`/api/orders/${id}/confirm`, { method: "POST" });
          setBusy(false);
          if (res.ok) { toast("success", "Pagamento confirmado. O cliente foi avisado."); router.refresh(); }
          else toast("error", "Não deu para confirmar agora.");
        }}>Confirmar que recebi</Button>
      )}
    </section>
  );
}

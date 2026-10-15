import { clsx } from "clsx";

export type GalleryStatus = "draft" | "sent" | "in_progress" | "submitted" | "expired" | "delivered" | "archived";

const map: Record<GalleryStatus, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "text-muted border-line" },
  sent: { label: "Aguardando cliente", className: "text-info border-info" },
  in_progress: { label: "Escolhendo", className: "text-warning border-warning" },
  submitted: { label: "Seleção recebida", className: "text-success border-success" },
  expired: { label: "Prazo vencido", className: "text-danger border-danger" },
  delivered: { label: "Entregue", className: "text-ink border-ink" },
  archived: { label: "Arquivada", className: "text-muted border-line" },
};

export function StatusBadge({ status }: { status: GalleryStatus }) {
  const s = map[status];
  return (
    <span className={clsx("inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-pill border bg-raised px-2.5 text-xs", s.className)}>
      {s.label}
    </span>
  );
}

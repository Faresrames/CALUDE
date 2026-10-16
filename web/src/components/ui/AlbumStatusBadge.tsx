import { clsx } from "clsx";

export type AlbumStatus = "pending" | "changes_requested" | "approved";

const map: Record<AlbumStatus, { label: string; className: string }> = {
  pending: { label: "Esperando o cliente", className: "text-info border-info" },
  changes_requested: { label: "Ajustes pedidos", className: "text-warning border-warning" },
  approved: { label: "Aprovado", className: "text-success border-success" },
};

export function AlbumStatusBadge({ status }: { status: AlbumStatus | null }) {
  const s = status ? map[status] : { label: "Sem versão", className: "text-muted border-line" };
  return (
    <span className={clsx("inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-pill border bg-raised px-2.5 text-xs", s.className)}>
      {s.label}
    </span>
  );
}

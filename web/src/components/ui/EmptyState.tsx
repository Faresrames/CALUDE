import type { ReactNode } from "react";

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line-input bg-raised px-6 py-12 text-center">
      <span aria-hidden className="text-muted">{icon}</span>
      <h3 className="font-display text-lg text-ink">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{body}</p>
      {action}
    </div>
  );
}

import { Hammer } from "lucide-react";

/** Tela ainda não construída: diz o que ela vai fazer. */
export function Stub({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl text-ink">{title}</h1>
      <div className="flex gap-3 rounded-lg border border-dashed border-line-input bg-raised p-5 text-sm text-muted">
        <Hammer aria-hidden className="size-5 shrink-0" />
        <div>
          <p className="font-semibold text-ink">Em construção ({id})</p>
          <div className="mt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

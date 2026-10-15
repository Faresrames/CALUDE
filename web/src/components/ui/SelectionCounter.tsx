import { clsx } from "clsx";

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export type SelectionCounterProps = {
  count: number;
  packageSize: number;
  extraPriceCents?: number;
  allowExtras?: boolean;
};

/** Contador fixo da seleção. Mostra o que o servidor confirmou, não o que o celular calculou. */
export function SelectionCounter({ count, packageSize, extraPriceCents = 0, allowExtras = true }: SelectionCounterProps) {
  const extras = Math.max(0, count - packageSize);
  const pct = packageSize > 0 ? Math.min(100, (count / packageSize) * 100) : 0;
  const full = count >= packageSize;
  return (
    <div className="flex min-w-56 flex-col gap-1.5" role="status" aria-live="polite">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-ink">
          {count} de {packageSize} fotos do pacote
        </span>
        {extras > 0 && (
          <span className="text-warning">
            +{extras} {extras === 1 ? "extra" : "extras"} · {formatBRL(extras * extraPriceCents)}
          </span>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-pill bg-surface" aria-hidden>
        <div
          className={clsx("h-full rounded-pill transition-all duration-200 ease-brand", extras > 0 ? "bg-warning" : "bg-selected")}
          style={{ width: `${pct}%` }}
        />
      </div>
      {full && extras === 0 && (
        <p className="text-xs text-muted">
          {allowExtras
            ? `Pacote completo. Cada foto a mais custa ${formatBRL(extraPriceCents)}.`
            : "Pacote completo. Desmarque uma foto para trocar."}
        </p>
      )}
    </div>
  );
}

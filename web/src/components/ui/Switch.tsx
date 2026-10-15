"use client";
import { clsx } from "clsx";
import { useId } from "react";

export type SwitchProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function Switch({ label, description, checked, onChange, disabled }: SwitchProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative h-6 w-11 shrink-0 rounded-pill border transition-colors duration-150 ease-brand",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "border-selected bg-selected" : "border-line-input bg-surface",
        )}
      >
        <span
          aria-hidden
          className={clsx(
            "absolute top-0.5 size-4.5 rounded-pill bg-raised shadow-card transition-transform duration-150 ease-brand",
            checked ? "translate-x-5.5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

"use client";
import { clsx } from "clsx";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Toast = { id: number; tone: "success" | "error"; text: string };
const Ctx = createContext<(tone: Toast["tone"], text: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((tone: Toast["tone"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role={t.tone === "error" ? "alert" : "status"}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-md bg-accent px-4 py-3 text-sm text-on-accent shadow-pop">
            {t.tone === "success" ? <CheckCircle2 aria-hidden className="size-4 shrink-0" /> : <AlertCircle aria-hidden className="size-4 shrink-0" />}
            <span className="flex-1">{t.text}</span>
            <button type="button" aria-label="Fechar aviso" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
              className={clsx("grid size-6 place-items-center rounded-sm hover:bg-on-accent/15")}>
              <X aria-hidden className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

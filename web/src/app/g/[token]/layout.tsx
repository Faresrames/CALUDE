import { ToastProvider } from "@/components/ui/Toast";
import { BRAND } from "@/lib/brand";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <footer className="px-4 pb-8 pt-4 text-center text-xs text-muted">Galeria por {BRAND.name}</footer>
    </ToastProvider>
  );
}

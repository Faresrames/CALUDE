import { redirect } from "next/navigation";
import { ManagerNav } from "@/components/app/ManagerNav";
import { ToastProvider } from "@/components/ui/Toast";
import { endSession, requirePhotographer } from "@/lib/auth";

async function logout() {
  "use server";
  await endSession();
  redirect("/entrar");
}

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const p = await requirePhotographer();
  return (
    <ToastProvider>
      <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
        <aside className="sticky top-0 z-20 border-b border-line bg-bg/95 px-2 py-2 backdrop-blur lg:h-dvh lg:border-b-0 lg:border-r lg:px-3 lg:py-6">
          <ManagerNav name={p.businessName ?? p.name} logout={logout} />
        </aside>
        <main className="mx-auto w-full max-w-content px-4 py-6 lg:px-8 lg:py-10">{children}</main>
      </div>
    </ToastProvider>
  );
}

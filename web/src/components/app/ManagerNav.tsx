"use client";
import { clsx } from "clsx";
import { Album, CreditCard, Images, LogOut, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/gerenciador", label: "Galerias", icon: Images, exact: false },
  { href: "/gerenciador/clientes", label: "Clientes", icon: Users },
  { href: "/gerenciador/albuns", label: "Álbuns", icon: Album },
  { href: "/gerenciador/configuracoes", label: "Configurações", icon: Settings },
  { href: "/gerenciador/plano", label: "Plano", icon: CreditCard },
];

function active(path: string, href: string) {
  if (href === "/gerenciador") return path === href || path.startsWith("/gerenciador/galerias");
  return path.startsWith(href);
}

export function ManagerNav({ name, logout }: { name: string; logout: () => Promise<void> }) {
  const path = usePathname();
  return (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      <p className="mb-4 hidden truncate px-3 font-display text-lg text-ink lg:block">{name}</p>
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {items.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} aria-current={active(path, href) ? "page" : undefined}
              className={clsx("flex h-10 items-center gap-2 whitespace-nowrap rounded-md px-3 text-sm",
                active(path, href) ? "bg-surface font-semibold text-ink" : "text-muted hover:bg-surface hover:text-ink")}>
              <Icon aria-hidden className="size-4" />
              {label}
            </Link>
          </li>
        ))}
        <li className="lg:mt-4">
          <form action={logout}>
            <button type="submit" className="flex h-10 items-center gap-2 whitespace-nowrap rounded-md px-3 text-sm text-muted hover:bg-surface hover:text-ink">
              <LogOut aria-hidden className="size-4" />
              Sair
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}

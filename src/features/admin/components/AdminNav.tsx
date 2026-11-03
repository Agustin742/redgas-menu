"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CupIcon, GearIcon, HomeIcon, ListIcon } from "@/components/ui/icons";

const links = [
  { href: "/admin", label: "Inicio", Icon: HomeIcon },
  { href: "/admin/categories", label: "Categorías", Icon: ListIcon },
  { href: "/admin/products", label: "Productos", Icon: CupIcon },
  { href: "/admin/settings", label: "Configuración", shortLabel: "Ajustes", Icon: GearIcon },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones del panel"
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 rounded-full bg-espresso p-1.5 shadow-[0_12px_32px_-12px_rgba(36,21,14,0.65)] md:static md:inset-auto md:rounded-none md:bg-transparent md:p-0 md:shadow-none"
    >
      <ul className="flex gap-1 md:flex-col md:gap-1.5">
        {links.map(({ href, label, Icon, ...rest }) => {
          const shortLabel = "shortLabel" in rest ? rest.shortLabel : undefined;
          const active =
            href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1 md:flex-none">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-full px-2 text-xs font-semibold md:min-h-11 md:flex-row md:gap-2 md:px-4 md:text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-espresso md:justify-start ${
                  active
                    ? "bg-coffee-yellow text-espresso"
                    : "text-cream/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon />
                {shortLabel ? (
                  <>
                    <span className="md:hidden">{shortLabel}</span>
                    <span className="hidden md:inline">{label}</span>
                  </>
                ) : (
                  label
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

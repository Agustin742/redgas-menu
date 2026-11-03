import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ListIcon } from "@/components/ui/icons";
import { plural, summarizeMenu } from "@/features/admin/menu-summary";
import { getSession } from "@/server/auth/session";
import { listCategories } from "@/server/categories/service";
import { listProducts } from "@/server/products/service";

export const metadata: Metadata = {
  title: "Panel | Red Gas",
  robots: { index: false },
};

const shortcuts = [
  {
    href: "/admin/categories",
    label: "Categorías",
    description: "Creá, ordená y ocultá las secciones de la carta.",
    Icon: ListIcon,
  },
] as const;

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [categories, products] = await Promise.all([
    listCategories(session.business.id),
    listProducts(session.business.id),
  ]);
  const summary = summarizeMenu(categories, products);

  const attention = [
    summary.hiddenCategories > 0 &&
      `${plural(summary.hiddenCategories, "categoría oculta", "categorías ocultas")}`,
    summary.unavailableProducts > 0 &&
      `${plural(summary.unavailableProducts, "producto sin stock", "productos sin stock")}`,
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="max-w-2xl">
      <p className="font-accent text-lg text-roast">Hola de nuevo,</p>
      <h1 className="mt-1 break-words font-display text-3xl leading-none tracking-[-0.03em] text-espresso md:text-4xl">
        {session.user.name}
      </h1>

      <section
        aria-labelledby="menu-status-heading"
        className="mt-8 rounded-3xl bg-espresso p-6 text-cream shadow-[0_14px_36px_-18px_rgba(36,21,14,0.7)] sm:p-7"
      >
        <h2 id="menu-status-heading" className="font-accent text-lg text-coffee-yellow">
          Tu carta hoy
        </h2>
        <p className="mt-2 text-xl font-semibold leading-snug text-white sm:text-2xl">
          {plural(summary.visibleCategories, "categoría visible", "categorías visibles")}
          <span className="text-coffee-yellow"> · </span>
          {plural(summary.products, "producto")}
        </p>

        {attention.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Para revisar">
            {attention.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-cream"
              >
                <span aria-hidden="true" className="size-2 rounded-full bg-energy-orange" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-cream/80">
            Todo lo que cargaste está visible para tus clientes.
          </p>
        )}

        <a
          href={`/c/${session.business.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-coffee-yellow px-5 text-sm font-semibold text-espresso transition-colors hover:bg-[#f7c84a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-espresso"
        >
          Ver mi carta
          <span aria-hidden="true">↗</span>
          <span className="sr-only">(se abre en otra pestaña)</span>
        </a>
      </section>

      <section aria-labelledby="shortcuts-heading" className="mt-10">
        <h2 id="shortcuts-heading" className="font-display text-xl tracking-[-0.02em] text-espresso">
          Accesos rápidos
        </h2>
        <ul className="mt-4 flex flex-col gap-2">
          {shortcuts.map(({ href, label, description, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_6px_20px_-14px_rgba(36,21,14,0.45)] transition-colors hover:bg-[#fffaf1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2"
              >
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-cream text-espresso">
                  <Icon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-espresso">{label}</span>
                  <span className="block text-sm text-roast">{description}</span>
                </span>
                <span
                  aria-hidden="true"
                  className="text-roast transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

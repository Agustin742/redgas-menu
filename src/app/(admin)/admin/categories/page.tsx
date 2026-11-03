import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CategoriesManager } from "@/features/admin/components/CategoriesManager";
import { getSession } from "@/server/auth/session";
import { listCategories } from "@/server/categories/service";

export const metadata: Metadata = {
  title: "Categorías | Red Gas",
  robots: { index: false },
};

export default async function CategoriesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const categories = await listCategories(session.business.id);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl leading-none tracking-[-0.03em] text-espresso md:text-4xl">
        Categorías
      </h1>
      <p className="mt-3 max-w-prose text-roast">
        Organizá las secciones de tu carta. El orden de acá es el que ven tus
        clientes.
      </p>
      <CategoriesManager
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          isVisible: category.isVisible,
          productCount: category._count.products,
        }))}
      />
    </div>
  );
}

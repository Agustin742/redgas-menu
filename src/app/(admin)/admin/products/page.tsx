import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProductsManager } from "@/features/admin/components/ProductsManager";
import { getSession } from "@/server/auth/session";
import { listCategories } from "@/server/categories/service";
import { listProducts } from "@/server/products/service";

export const metadata: Metadata = {
  title: "Productos | Red Gas",
  robots: { index: false },
};

const notices: Record<string, string> = {
  created: "Producto creado.",
  updated: "Cambios guardados.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { saved } = await searchParams;
  const [categories, products] = await Promise.all([
    listCategories(session.business.id),
    listProducts(session.business.id),
  ]);

  const groups = categories.map((category) => ({
    categoryId: category.id,
    categoryName: category.name,
    isVisible: category.isVisible,
    products: products
      .filter((product) => product.categoryId === category.id)
      .map((product) => ({
        id: product.id,
        name: product.name,
        priceCents: product.priceCents,
        imageUrl: product.imageUrl,
        imageAlt: product.imageAlt,
        isAvailable: product.isAvailable,
        isFeatured: product.isFeatured,
      })),
  }));

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl leading-none tracking-[-0.03em] text-espresso md:text-4xl">
        Productos
      </h1>
      <p className="mt-3 max-w-prose text-roast">
        Cargá lo que ofrecés, con su precio y foto. Cada categoría mantiene su propio orden.
      </p>
      <ProductsManager
        groups={groups}
        hasCategories={categories.length > 0}
        notice={saved ? notices[saved] : undefined}
      />
    </div>
  );
}

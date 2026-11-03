import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductForm } from "@/features/admin/components/ProductForm";
import { getSession } from "@/server/auth/session";
import { listCategories } from "@/server/categories/service";
import { listProducts } from "@/server/products/service";

export const metadata: Metadata = {
  title: "Editar producto | Red Gas",
  robots: { index: false },
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const [categories, products] = await Promise.all([
    listCategories(session.business.id),
    listProducts(session.business.id),
  ]);
  const product = products.find((item) => item.id === id);
  if (!product) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/products"
        className="text-sm font-semibold text-roast underline-offset-4 hover:text-espresso hover:underline"
      >
        ← Productos
      </Link>
      <h1 className="mt-4 break-words font-display text-3xl leading-none tracking-[-0.03em] text-espresso md:text-4xl">
        Editar producto
      </h1>
      <ProductForm
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          isVisible: category.isVisible,
        }))}
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          priceCents: product.priceCents,
          categoryId: product.categoryId,
          imageUrl: product.imageUrl,
          imageAlt: product.imageAlt,
          isAvailable: product.isAvailable,
          isFeatured: product.isFeatured,
        }}
      />
    </div>
  );
}

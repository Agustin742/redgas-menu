import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductForm } from "@/features/admin/components/ProductForm";
import { getSession } from "@/server/auth/session";
import { listCategories } from "@/server/categories/service";

export const metadata: Metadata = {
  title: "Nuevo producto | Red Gas",
  robots: { index: false },
};

export default async function NewProductPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const categories = await listCategories(session.business.id);

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/products"
        className="text-sm font-semibold text-roast underline-offset-4 hover:text-espresso hover:underline"
      >
        ← Productos
      </Link>
      <h1 className="mt-4 font-display text-3xl leading-none tracking-[-0.03em] text-espresso md:text-4xl">
        Nuevo producto
      </h1>
      {categories.length === 0 ? (
        <p className="mt-8 rounded-3xl bg-white p-8 text-center text-roast shadow-[0_6px_20px_-12px_rgba(36,21,14,0.35)]">
          Para cargar productos primero necesitás una categoría.{" "}
          <Link
            href="/admin/categories"
            className="font-semibold text-espresso underline underline-offset-4"
          >
            Crear categorías
          </Link>
        </p>
      ) : (
        <ProductForm
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
            isVisible: category.isVisible,
          }))}
        />
      )}
    </div>
  );
}

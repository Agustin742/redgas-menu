import { notFound } from "next/navigation";
import { CategoryNav } from "@/features/menu/components/CategoryNav";
import { MenuHeader } from "@/features/menu/components/MenuHeader";
import { ProductCard } from "@/features/menu/components/ProductCard";
import { redGasCategories } from "@/features/menu/mock-categories";
import { redGasBusiness } from "@/features/menu/mock-business";
import { redGasMockProduct } from "@/features/menu/mock-products";

export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug !== "red-gas") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-cream">
      <MenuHeader business={redGasBusiness} />
      <CategoryNav categories={redGasCategories} />
      <section
        aria-labelledby="product-preview-heading"
        className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8 sm:pb-12"
      >
        <h2
          id="product-preview-heading"
          className="mb-4 font-display text-xl tracking-tight text-espresso sm:text-2xl"
        >
          Producto ilustrativo
        </h2>
        <div className="max-w-md">
          <ProductCard product={redGasMockProduct} />
        </div>
      </section>
    </main>
  );
}

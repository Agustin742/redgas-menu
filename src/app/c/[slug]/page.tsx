import { notFound } from "next/navigation";
import { CategoryNav } from "@/features/menu/components/CategoryNav";
import { MenuHeader } from "@/features/menu/components/MenuHeader";
import { CategorySection } from "@/features/menu/components/CategorySection";
import { MenuFooter } from "@/features/menu/components/MenuFooter";
import { redGasCategories } from "@/features/menu/mock-categories";
import { redGasBusiness, redGasFooter } from "@/features/menu/mock-business";
import { redGasMockProducts } from "@/features/menu/mock-products";

export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug !== "red-gas") {
    notFound();
  }

  const categoriesWithProducts = redGasCategories.filter((category) =>
    redGasMockProducts.some((product) => product.categoryId === category.id),
  );
  return (
    <main className="min-h-screen bg-cream">
      <MenuHeader business={redGasBusiness} />
      <CategoryNav categories={categoriesWithProducts} />
      {categoriesWithProducts.map((category, index) => (
        <CategorySection
          key={category.id}
          category={category}
          products={redGasMockProducts}
          background={index % 2 === 0 ? "cream" : "white"}
        />
      ))}
      <MenuFooter businessName={redGasBusiness.name} footer={redGasFooter} />
    </main>
  );
}

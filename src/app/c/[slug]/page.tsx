import { notFound } from "next/navigation";
import { CategoryNav } from "@/features/menu/components/CategoryNav";
import { MenuHeader } from "@/features/menu/components/MenuHeader";
import { CategorySection } from "@/features/menu/components/CategorySection";
import { redGasCategories } from "@/features/menu/mock-categories";
import { redGasBusiness } from "@/features/menu/mock-business";
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

  return (
    <main className="min-h-screen bg-cream">
      <MenuHeader business={redGasBusiness} />
      <CategoryNav categories={redGasCategories} />
      <CategorySection
        category={redGasCategories[0]}
        products={redGasMockProducts}
        background="cream"
      />
      <CategorySection
        category={redGasCategories[4]}
        products={redGasMockProducts}
        background="white"
      />
    </main>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryNav } from "@/features/menu/components/CategoryNav";
import { MenuHeader } from "@/features/menu/components/MenuHeader";
import { PromoCarousel } from "@/features/menu/components/PromoCarousel";
import { CategorySection } from "@/features/menu/components/CategorySection";
import { MenuFooter } from "@/features/menu/components/MenuFooter";
import { getPublicMenu } from "@/server/public-menu/service";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getPublicMenu(slug);
  if (!menu) return {};
  return {
    title: `${menu.business.name} | Carta`,
    description: menu.business.description,
  };
}

export default async function PublicMenuPage({ params }: PageProps) {
  const { slug } = await params;
  const menu = await getPublicMenu(slug);

  if (!menu) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-cream">
      <MenuHeader business={menu.business} />
      <PromoCarousel promotions={menu.promotions} />
      <CategoryNav categories={menu.categories} />
      {menu.categories.map((category, index) => (
        <CategorySection
          key={category.id}
          category={category}
          products={menu.products}
          background={index % 2 === 0 ? "cream" : "white"}
        />
      ))}
      <MenuFooter businessName={menu.business.name} footer={menu.footer} />
    </main>
  );
}

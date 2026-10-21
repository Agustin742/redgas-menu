import type { MenuCategory, MenuProduct } from "@/features/menu/types";
import { ProductCard } from "@/features/menu/components/ProductCard";

type CategorySectionProps = {
  category: MenuCategory;
  products: MenuProduct[];
  background: "cream" | "white";
};

export function CategorySection({
  category,
  products,
  background,
}: CategorySectionProps) {
  const categoryProducts = products.filter(
    (product) => product.categoryId === category.id,
  );
  const headingId = `category-section-${category.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className={background === "cream" ? "bg-cream" : "bg-white"}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
        <div className="mb-4">
          <h2
            id={headingId}
            className="font-display text-xl tracking-tight text-espresso sm:text-2xl"
          >
            {category.name}
          </h2>
        </div>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {categoryProducts.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

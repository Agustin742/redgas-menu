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
      <div className="mx-auto w-full max-w-6xl px-4 py-9 sm:px-8 sm:py-12">
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-warm-border pb-3 sm:mb-7 sm:pb-4">
          <h2
            id={headingId}
            className="font-display text-2xl tracking-[-0.04em] text-espresso sm:text-3xl"
          >
            {category.name}
          </h2>
          <span aria-hidden="true" className="mb-1 h-2 w-10 bg-coffee-yellow sm:w-14" />
        </div>

        <ul className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
          {categoryProducts.map((product) => (
            <li
              key={product.id}
              className={
                product.featured
                  ? `${product.image ? "sm:col-span-2 " : ""}mb-5 sm:mb-6`
                  : undefined
              }
            >
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

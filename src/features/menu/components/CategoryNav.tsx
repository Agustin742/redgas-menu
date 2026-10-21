"use client";

import { useState } from "react";
import type { MenuCategory } from "@/features/menu/types";

type CategoryNavProps = {
  categories: MenuCategory[];
};

export function CategoryNav({ categories }: CategoryNavProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0]?.id ?? null,
  );

  return (
    <section
      aria-labelledby="category-preview-heading"
      className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8"
    >
      <div className="mb-4">
        <h2
          id="category-preview-heading"
          className="font-display text-xl tracking-tight text-espresso sm:text-2xl"
        >
          Categorías de ejemplo
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-roast sm:text-base">
          Muy pronto vas a encontrar nuestros productos.
        </p>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] touch-pan-x sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max min-w-full gap-2 pb-1">
          {categories.map((category) => {
            const isSelected = category.id === selectedCategoryId;

            return (
              <li key={category.id} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 ${
                    isSelected
                      ? "border-espresso bg-espresso text-white"
                      : "border-warm-border bg-white text-espresso hover:bg-cream"
                  }`}
                >
                  {category.name}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

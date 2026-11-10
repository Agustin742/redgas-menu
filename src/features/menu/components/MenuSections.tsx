"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { MenuCategory, MenuProduct } from "@/features/menu/types";
import { CategoryNav } from "@/features/menu/components/CategoryNav";
import { CategorySection } from "@/features/menu/components/CategorySection";

type MenuSectionsProps = {
  categories: MenuCategory[];
  products: MenuProduct[];
};

const REORDER_DURATION_MS = 450;

export function MenuSections({ categories, products }: MenuSectionsProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0]?.id ?? null,
  );
  const sectionRefs = useRef(new Map<string, HTMLDivElement>());
  const previousTops = useRef<Map<string, number> | null>(null);

  const selected = categories.find((c) => c.id === selectedCategoryId);
  const orderedCategories = selected
    ? [selected, ...categories.filter((c) => c.id !== selected.id)]
    : categories;

  function handleSelect(categoryId: string) {
    if (categoryId === selectedCategoryId) return;
    // Capture positions before the reorder (FLIP "First").
    const tops = new Map<string, number>();
    sectionRefs.current.forEach((element, id) => {
      tops.set(id, element.getBoundingClientRect().top);
    });
    previousTops.current = tops;
    setSelectedCategoryId(categoryId);
  }

  useLayoutEffect(() => {
    const tops = previousTops.current;
    previousTops.current = null;
    if (!tops) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // FLIP "Last, Invert, Play": animate each section from its old position.
    sectionRefs.current.forEach((element, id) => {
      const previousTop = tops.get(id);
      if (previousTop === undefined) return;
      const delta = previousTop - element.getBoundingClientRect().top;
      if (delta === 0) return;
      element.animate(
        [
          { transform: `translateY(${delta}px)` },
          { transform: "translateY(0)" },
        ],
        {
          duration: REORDER_DURATION_MS,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );
    });
  }, [selectedCategoryId]);

  return (
    <>
      <CategoryNav
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelect={handleSelect}
      />
      <div className="relative overflow-hidden">
        {orderedCategories.map((category, index) => (
          <div
            key={category.id}
            ref={(element) => {
              if (element) sectionRefs.current.set(category.id, element);
              else sectionRefs.current.delete(category.id);
            }}
            className={category.id === selectedCategoryId ? "relative z-10" : "relative"}
          >
            <CategorySection
              category={category}
              products={products}
              background={index % 2 === 0 ? "cream" : "white"}
            />
          </div>
        ))}
      </div>
    </>
  );
}

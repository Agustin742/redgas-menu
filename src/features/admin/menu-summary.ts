type CategoryInput = { isVisible: boolean };
type ProductInput = { isAvailable: boolean };

export type MenuSummary = {
  visibleCategories: number;
  hiddenCategories: number;
  products: number;
  unavailableProducts: number;
};

export function summarizeMenu(
  categories: CategoryInput[],
  products: ProductInput[],
): MenuSummary {
  const visibleCategories = categories.filter((c) => c.isVisible).length;
  return {
    visibleCategories,
    hiddenCategories: categories.length - visibleCategories,
    products: products.length,
    unavailableProducts: products.filter((p) => !p.isAvailable).length,
  };
}

/** Spanish count with singular/plural noun, e.g. plural(1, "producto") → "1 producto". */
export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

import { plural, summarizeMenu } from "./menu-summary";

describe("summarizeMenu", () => {
  it("counts visible/hidden categories and unavailable products", () => {
    expect(
      summarizeMenu(
        [{ isVisible: true }, { isVisible: false }, { isVisible: true }],
        [{ isAvailable: true }, { isAvailable: false }],
      ),
    ).toEqual({
      visibleCategories: 2,
      hiddenCategories: 1,
      products: 2,
      unavailableProducts: 1,
    });
  });

  it("handles an empty menu", () => {
    expect(summarizeMenu([], [])).toEqual({
      visibleCategories: 0,
      hiddenCategories: 0,
      products: 0,
      unavailableProducts: 0,
    });
  });
});

describe("plural", () => {
  it("uses singular only for 1", () => {
    expect(plural(1, "producto")).toBe("1 producto");
    expect(plural(0, "producto")).toBe("0 productos");
    expect(plural(3, "categoría")).toBe("3 categorías");
  });

  it("accepts an explicit plural form", () => {
    expect(plural(2, "categoría oculta", "categorías ocultas")).toBe(
      "2 categorías ocultas",
    );
  });
});

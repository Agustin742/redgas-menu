import { formatPrice, parsePriceInput, priceToInput } from "./price";

describe("parsePriceInput", () => {
  it("accepts plain, grouped and decimal-comma prices", () => {
    expect(parsePriceInput("2800")).toBe(280000);
    expect(parsePriceInput("2.800")).toBe(280000);
    expect(parsePriceInput("2800,50")).toBe(280050);
    expect(parsePriceInput("$ 999.999,5")).toBe(99999950);
    expect(parsePriceInput("0")).toBe(0);
  });

  it("treats a dot followed by 1-2 digits as decimals", () => {
    expect(parsePriceInput("28.5")).toBe(2850);
    expect(parsePriceInput("28.05")).toBe(2805);
  });

  it("rejects invalid text and out-of-range values", () => {
    expect(parsePriceInput("")).toBeNull();
    expect(parsePriceInput("abc")).toBeNull();
    expect(parsePriceInput("-5")).toBeNull();
    expect(parsePriceInput("1,2,3")).toBeNull();
    expect(parsePriceInput("2800,555")).toBeNull();
    expect(parsePriceInput("1.23.4")).toBeNull();
    expect(parsePriceInput("1000001")).toBeNull();
  });
});

describe("formatPrice / priceToInput", () => {
  it("formats without decimals when cents are zero", () => {
    expect(formatPrice(280000)).toBe("$ 2.800");
    expect(formatPrice(0)).toBe("$ 0");
    expect(formatPrice(125000000)).toBe("$ 1.250.000");
  });

  it("adds decimals otherwise", () => {
    expect(formatPrice(280050)).toBe("$ 2.800,50");
    expect(formatPrice(5)).toBe("$ 0,05");
  });

  it("round-trips through the input text", () => {
    for (const cents of [0, 5, 280000, 280050, 99999999]) {
      expect(parsePriceInput(priceToInput(cents))).toBe(cents);
    }
  });
});

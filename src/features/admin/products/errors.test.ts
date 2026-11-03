import { productErrorMessage, productFieldErrors } from "./errors";

describe("productFieldErrors", () => {
  it("maps API paths to form fields", () => {
    const errors = productFieldErrors([
      { path: "priceCents", message: "x" },
      { path: "name", message: "x" },
      { path: "imagePublicId", message: "x" },
      { path: "unknown", message: "x" },
    ]);
    expect(Object.keys(errors).sort()).toEqual(["image", "name", "price"]);
  });

  it("ignores missing details", () => {
    expect(productFieldErrors(undefined)).toEqual({});
  });
});

describe("productErrorMessage", () => {
  it("covers product codes and falls back to shared messages", () => {
    expect(productErrorMessage("uploads_unavailable")).toMatch(/sin foto/);
    expect(productErrorMessage("unauthorized")).toMatch(/sesión/);
  });
});

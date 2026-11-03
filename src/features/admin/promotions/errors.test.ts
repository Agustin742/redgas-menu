import { promotionErrorMessage, promotionFieldErrors } from "./errors";

describe("promotionFieldErrors", () => {
  it("maps known API paths to form fields in Spanish", () => {
    const errors = promotionFieldErrors([
      { path: "endsAt", message: "endsAt must be after startsAt" },
      { path: "imagePublicId", message: "x" },
      { path: "imageUrl", message: "y" },
      { path: "unknown", message: "z" },
    ]);
    expect(errors.endsAt).toMatch(/posterior/);
    expect(errors.image).toMatch(/imagen/);
    expect(Object.keys(errors).sort()).toEqual(["endsAt", "image"]);
  });

  it("ignores malformed details", () => {
    expect(promotionFieldErrors(undefined)).toEqual({});
    expect(promotionFieldErrors([null, { path: 3 }])).toEqual({});
  });
});

describe("promotionErrorMessage", () => {
  it("uses promotion-specific copy and falls back to the generic one", () => {
    expect(promotionErrorMessage("not_found")).toMatch(/promoción/);
    expect(promotionErrorMessage("forbidden")).toMatch(/permisos/);
  });
});

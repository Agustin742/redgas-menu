import { adminErrorMessage, ADMIN_NETWORK_ERROR } from "./api-errors";
import { moveId } from "./reorder";

describe("adminErrorMessage", () => {
  it("maps known codes to Spanish", () => {
    expect(adminErrorMessage("conflict")).toMatch(/Ya existe/);
    expect(adminErrorMessage("category_not_empty")).toMatch(/productos/);
    expect(adminErrorMessage("unauthorized")).toMatch(/sesión/);
  });

  it("falls back to the network message", () => {
    expect(adminErrorMessage(undefined)).toBe(ADMIN_NETWORK_ERROR);
    expect(adminErrorMessage("http_418")).toBe(ADMIN_NETWORK_ERROR);
  });
});

describe("moveId", () => {
  it("swaps with the neighbor", () => {
    expect(moveId(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveId(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
  });

  it("is a no-op at the ends", () => {
    const ids = ["a", "b"];
    expect(moveId(ids, 0, -1)).toBe(ids);
    expect(moveId(ids, 1, 1)).toBe(ids);
  });
});

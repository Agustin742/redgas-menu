import { businessFieldErrors, indexedFieldErrors, settingsErrorMessage } from "./errors";

describe("settings errors", () => {
  it("maps business details to Spanish by field, once per field", () => {
    const result = businessFieldErrors([
      { path: "contactEmail", message: "Invalid email" },
      { path: "logoUrl", message: "x" },
      { path: "logoPublicId", message: "y" },
    ]);
    expect(result.contactEmail).toMatch(/email/);
    expect(result.logo).toMatch(/logo/);
    expect(Object.keys(result)).toHaveLength(2);
  });

  it("indexes list errors by position", () => {
    const result = indexedFieldErrors(
      [
        { path: "links.2.handle", message: "x" },
        { path: "hours.0.opensAt", message: "y" },
      ],
      "links",
    );
    expect(result[2].handle).toBeDefined();
    expect(Object.keys(result)).toEqual(["2"]);
    expect(indexedFieldErrors(undefined, "links")).toEqual({});
  });

  it("explains owner-only failures", () => {
    expect(settingsErrorMessage("forbidden")).toMatch(/dueño/);
  });
});

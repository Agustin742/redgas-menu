import { loginErrorMessage, retryAfterMinutes } from "./login-errors";

describe("retryAfterMinutes", () => {
  it("rounds seconds up to whole minutes with a minimum of 1", () => {
    expect(retryAfterMinutes("1")).toBe(1);
    expect(retryAfterMinutes("0")).toBe(1);
    expect(retryAfterMinutes("60")).toBe(1);
    expect(retryAfterMinutes("61")).toBe(2);
    expect(retryAfterMinutes("600")).toBe(10);
  });

  it("returns null for missing or invalid values", () => {
    expect(retryAfterMinutes(null)).toBeNull();
    expect(retryAfterMinutes("")).toBeNull();
    expect(retryAfterMinutes("abc")).toBeNull();
    expect(retryAfterMinutes("-5")).toBeNull();
  });
});

describe("loginErrorMessage", () => {
  it("maps known codes to Spanish", () => {
    expect(loginErrorMessage("invalid_credentials")).toBe(
      "Email o contraseña incorrectos.",
    );
    expect(loginErrorMessage("validation_error")).toBe(
      "Revisá el email y la contraseña.",
    );
    expect(loginErrorMessage("invalid_json")).toBe(
      "Revisá el email y la contraseña.",
    );
  });

  it("includes minutes for too_many_attempts", () => {
    expect(loginErrorMessage("too_many_attempts", "90")).toBe(
      "Demasiados intentos. Probá de nuevo en 2 minutos.",
    );
    expect(loginErrorMessage("too_many_attempts", "30")).toBe(
      "Demasiados intentos. Probá de nuevo en 1 minuto.",
    );
  });

  it("falls back without minutes when Retry-After is unusable", () => {
    expect(loginErrorMessage("too_many_attempts", null)).toBe(
      "Demasiados intentos. Probá de nuevo en unos minutos.",
    );
  });

  it("uses the generic message for unknown codes", () => {
    expect(loginErrorMessage("boom")).toBe(
      "No pudimos conectar. Intentá de nuevo.",
    );
    expect(loginErrorMessage(undefined)).toBe(
      "No pudimos conectar. Intentá de nuevo.",
    );
  });
});

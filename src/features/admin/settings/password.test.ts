import { passwordErrorMessage, validatePasswordChange } from "./password";

const ok = { current: "old-password", next: "new-password", confirm: "new-password" };

describe("validatePasswordChange", () => {
  it("accepts a valid change", () => {
    expect(validatePasswordChange(ok)).toEqual({});
  });

  it("requires the current password", () => {
    expect(validatePasswordChange({ ...ok, current: "" }).current).toMatch(/actual/);
  });

  it("enforces the API length rules on the new password", () => {
    expect(validatePasswordChange({ ...ok, next: "short", confirm: "short" }).next).toMatch(/8/);
    const long = "x".repeat(201);
    expect(validatePasswordChange({ ...ok, next: long, confirm: long }).next).toMatch(/200/);
    expect(validatePasswordChange({ ...ok, next: "x".repeat(200), confirm: "x".repeat(200) })).toEqual({});
  });

  it("rejects a new password equal to the current one", () => {
    const same = { current: "same-password", next: "same-password", confirm: "same-password" };
    expect(validatePasswordChange(same).next).toMatch(/distinta/);
  });

  it("requires the confirmation to match", () => {
    expect(validatePasswordChange({ ...ok, confirm: "other-password" }).confirm).toMatch(/coinciden/);
  });
});

describe("passwordErrorMessage", () => {
  it("maps API codes to Spanish", () => {
    expect(passwordErrorMessage("invalid_password")).toMatch(/no es correcta/);
    expect(passwordErrorMessage("too_many_attempts")).toBe("Probaste muchas veces, esperá unos minutos.");
    expect(passwordErrorMessage("validation_error")).toMatch(/8/);
    expect(passwordErrorMessage(undefined)).toMatch(/conectar/);
  });
});

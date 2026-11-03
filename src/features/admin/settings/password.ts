/** Mirrors changePasswordSchema (src/server/auth/service.ts). */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 200;

export type PasswordDraft = { current: string; next: string; confirm: string };
export type PasswordErrors = Partial<Record<keyof PasswordDraft, string>>;

/** Spanish field errors for the change-password form; empty when it can be sent. */
export function validatePasswordChange(draft: PasswordDraft): PasswordErrors {
  const errors: PasswordErrors = {};
  if (draft.current === "") errors.current = "Ingresá tu contraseña actual.";
  if (draft.next.length < PASSWORD_MIN) {
    errors.next = `La nueva contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`;
  } else if (draft.next.length > PASSWORD_MAX) {
    errors.next = `La nueva contraseña puede tener hasta ${PASSWORD_MAX} caracteres.`;
  } else if (draft.next === draft.current) {
    errors.next = "La nueva contraseña tiene que ser distinta de la actual.";
  }
  if (draft.confirm !== draft.next) errors.confirm = "Las contraseñas no coinciden.";
  return errors;
}

/** Spanish message for a POST /api/auth/password error code. */
export function passwordErrorMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_password":
      return "La contraseña actual no es correcta.";
    case "too_many_attempts":
      return "Probaste muchas veces, esperá unos minutos.";
    case "validation_error":
    case "invalid_json":
      return `Revisá los datos: la nueva contraseña debe tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres y ser distinta de la actual.`;
    case "unauthorized":
      return "Tu sesión venció. Volvé a ingresar.";
    case "internal_error":
      return "Algo salió mal de nuestro lado. Probá de nuevo en un rato.";
    default:
      return "No pudimos conectar. Intentá de nuevo.";
  }
}

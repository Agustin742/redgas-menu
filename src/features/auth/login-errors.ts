export const NETWORK_ERROR_MESSAGE = "No pudimos conectar. Intentá de nuevo.";

/** Converts a Retry-After header (seconds) into whole minutes, at least 1. */
export function retryAfterMinutes(header: string | null): number | null {
  if (header === null || header.trim() === "") return null;
  const seconds = Number(header);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return Math.max(1, Math.ceil(seconds / 60));
}

/** Maps an API error code to a Spanish message shown on the login form. */
export function loginErrorMessage(
  code: string | undefined,
  retryAfter: string | null = null,
): string {
  switch (code) {
    case "invalid_credentials":
      return "Email o contraseña incorrectos.";
    case "validation_error":
    case "invalid_json":
      return "Revisá el email y la contraseña.";
    case "too_many_attempts": {
      const minutes = retryAfterMinutes(retryAfter);
      if (minutes === null) {
        return "Demasiados intentos. Probá de nuevo en unos minutos.";
      }
      const unit = minutes === 1 ? "minuto" : "minutos";
      return `Demasiados intentos. Probá de nuevo en ${minutes} ${unit}.`;
    }
    default:
      return NETWORK_ERROR_MESSAGE;
  }
}

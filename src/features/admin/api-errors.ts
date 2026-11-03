export const ADMIN_NETWORK_ERROR = "No pudimos conectar. Intentá de nuevo.";

/** Maps an admin API error code to a Spanish message. */
export function adminErrorMessage(code: string | undefined): string {
  switch (code) {
    case "validation_error":
    case "invalid_json":
      return "Revisá el nombre: no puede estar vacío ni superar los 80 caracteres.";
    case "conflict":
      return "Ya existe una categoría con ese nombre.";
    case "category_not_empty":
      return "No se puede eliminar: la categoría tiene productos. Movelos o eliminalos primero.";
    case "not_found":
      return "No encontramos ese elemento. Puede que ya se haya eliminado.";
    case "forbidden":
      return "No tenés permisos para hacer este cambio.";
    case "unauthorized":
      return "Tu sesión venció. Volvé a ingresar.";
    case "internal_error":
      return "Algo salió mal de nuestro lado. Probá de nuevo en un rato.";
    default:
      return ADMIN_NETWORK_ERROR;
  }
}

export type AdminResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string | undefined };

/** Calls the admin API and normalizes failures into an error code. */
export async function adminRequest<T = unknown>(
  url: string,
  init?: { method: string; body?: unknown },
): Promise<AdminResult<T>> {
  const hasBody = init?.body !== undefined;
  try {
    const response = await fetch(url, {
      method: init?.method,
      headers: hasBody ? { "Content-Type": "application/json" } : undefined,
      body: hasBody ? JSON.stringify(init?.body) : undefined,
    });
    if (response.ok) {
      const data =
        response.status === 204 ? null : await response.json().catch(() => null);
      return { ok: true, data: data as T };
    }
    const body = (await response.json().catch(() => null)) as {
      error?: { code?: string };
    } | null;
    return { ok: false, code: body?.error?.code ?? `http_${response.status}` };
  } catch {
    return { ok: false, code: undefined };
  }
}

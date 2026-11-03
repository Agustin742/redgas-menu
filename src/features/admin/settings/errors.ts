import { adminErrorMessage } from "@/features/admin/api-errors";

const logoMessage = "No pudimos usar el logo. Subilo de nuevo.";
const headerMessage = "No pudimos usar la foto de portada. Subila de nuevo.";

const businessMessages: Record<string, { field: string; message: string }> = {
  name: { field: "name", message: "Ingresá un nombre de hasta 80 caracteres." },
  description: { field: "description", message: "La descripción puede tener hasta 500 caracteres." },
  location: { field: "location", message: "Ingresá la ubicación (hasta 160 caracteres)." },
  contactEmail: { field: "contactEmail", message: "Revisá el email de contacto." },
  logoUrl: { field: "logo", message: logoMessage },
  logoPublicId: { field: "logo", message: logoMessage },
  headerImageUrl: { field: "header", message: headerMessage },
  headerImagePublicId: { field: "header", message: headerMessage },
};

/** Maps business PATCH validation `details` ({ path, message }[]) to Spanish messages by field. */
export function businessFieldErrors(details: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (!Array.isArray(details)) return result;
  for (const entry of details) {
    const path = (entry as { path?: unknown } | null)?.path;
    const known = typeof path === "string" ? businessMessages[path] : undefined;
    if (known && !result[known.field]) result[known.field] = known.message;
  }
  return result;
}

const listMessages: Record<string, string> = {
  handle: "Revisá el usuario o dato que se muestra.",
  url: "Revisá el enlace.",
  platform: "Revisá la red elegida.",
};

/** Indexed errors such as "links.2.handle" become { 2: { handle: "..." } }. */
export function indexedFieldErrors(
  details: unknown,
  prefix: string,
): Record<number, Record<string, string>> {
  const result: Record<number, Record<string, string>> = {};
  if (!Array.isArray(details)) return result;
  for (const entry of details) {
    const path = (entry as { path?: unknown } | null)?.path;
    if (typeof path !== "string") continue;
    const [head, index, field] = path.split(".");
    if (head !== prefix || index === undefined || field === undefined) continue;
    const position = Number(index);
    if (!Number.isInteger(position)) continue;
    result[position] ??= {};
    result[position][field] ??= listMessages[field] ?? "Revisá este dato.";
  }
  return result;
}

/** Spanish message for a settings API error code. */
export function settingsErrorMessage(code: string | undefined): string {
  switch (code) {
    case "forbidden":
      return "Solo el dueño puede cambiar la configuración del negocio.";
    case "validation_error":
    case "invalid_json":
      return "Revisá los datos e intentá de nuevo.";
    case "uploads_unavailable":
      return "La subida de imágenes no está disponible por ahora.";
    case "upload_failed":
      return "No pudimos subir la imagen. Probá de nuevo.";
    default:
      return adminErrorMessage(code);
  }
}

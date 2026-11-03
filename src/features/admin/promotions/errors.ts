import { adminErrorMessage } from "@/features/admin/api-errors";

const imageMessage = "No pudimos usar esa imagen. Subila de nuevo.";

const fieldMessages: Record<string, { field: string; message: string }> = {
  imageUrl: { field: "image", message: imageMessage },
  imagePublicId: { field: "image", message: imageMessage },
  imageAlt: {
    field: "imageAlt",
    message: "Describí la imagen en pocas palabras (hasta 160 caracteres).",
  },
  startsAt: { field: "startsAt", message: "Revisá la fecha de inicio." },
  endsAt: {
    field: "endsAt",
    message: "La fecha de fin tiene que ser posterior a la de inicio.",
  },
};

/** Maps API validation `details` ({ path, message }[]) to Spanish messages by form field. */
export function promotionFieldErrors(details: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (!Array.isArray(details)) return result;
  for (const entry of details) {
    const path = (entry as { path?: unknown } | null)?.path;
    const known = typeof path === "string" ? fieldMessages[path] : undefined;
    if (known && !result[known.field]) result[known.field] = known.message;
  }
  return result;
}

/** Spanish message for a promotion API error code. */
export function promotionErrorMessage(code: string | undefined): string {
  switch (code) {
    case "validation_error":
    case "invalid_json":
      return "Revisá los datos de la promoción e intentá de nuevo.";
    case "not_found":
      return "No encontramos esa promoción. Puede que ya se haya eliminado.";
    case "invalid_order":
      return "El orden cambió mientras trabajabas. Actualizá la página e intentá de nuevo.";
    case "uploads_unavailable":
      return "La subida de imágenes no está disponible por ahora. Probá más tarde.";
    default:
      return adminErrorMessage(code);
  }
}

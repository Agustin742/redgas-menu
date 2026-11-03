import { adminErrorMessage } from "@/features/admin/api-errors";

const imageMessage = "No pudimos usar esa imagen. Subila de nuevo.";

const fieldMessages: Record<string, { field: string; message: string }> = {
  name: { field: "name", message: "Ingresá un nombre de hasta 80 caracteres." },
  description: {
    field: "description",
    message: "La descripción puede tener hasta 300 caracteres.",
  },
  priceCents: { field: "price", message: "Revisá el precio." },
  categoryId: { field: "category", message: "Elegí una categoría." },
  imageAlt: {
    field: "imageAlt",
    message: "Describí la foto en pocas palabras (hasta 160 caracteres).",
  },
  imageUrl: { field: "image", message: imageMessage },
  imagePublicId: { field: "image", message: imageMessage },
};

/** Maps API validation `details` ({ path, message }[]) to Spanish messages by form field. */
export function productFieldErrors(details: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (!Array.isArray(details)) return result;
  for (const entry of details) {
    const path = (entry as { path?: unknown } | null)?.path;
    const known = typeof path === "string" ? fieldMessages[path] : undefined;
    if (known && !result[known.field]) result[known.field] = known.message;
  }
  return result;
}

/** Spanish message for a product API error code. */
export function productErrorMessage(code: string | undefined): string {
  switch (code) {
    case "validation_error":
    case "invalid_json":
      return "Revisá los datos del producto e intentá de nuevo.";
    case "not_found":
      return "No encontramos ese producto o esa categoría. Puede que ya se haya eliminado.";
    case "invalid_order":
      return "El orden cambió mientras trabajabas. Actualizá la página e intentá de nuevo.";
    case "uploads_unavailable":
      return "La subida de fotos no está disponible por ahora. Podés guardar el producto sin foto.";
    default:
      return adminErrorMessage(code);
  }
}

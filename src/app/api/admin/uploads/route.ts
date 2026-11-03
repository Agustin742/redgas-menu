import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { discardUnsavedImage } from "@/server/cloudinary";
import { handle, noContent, parseJson } from "@/server/http";

const schema = z.object({ publicId: z.string().min(1).max(300) });

/**
 * Discards an uploaded-but-unsaved image. Always 204: ids outside the business
 * folder and images still referenced by a product, promotion or business are
 * left untouched without revealing why. Logo/header ids need the OWNER role (403).
 */
export const DELETE = handle(async (request) => {
  const { user, business } = await requireSession();
  const { publicId } = await parseJson(request, schema);
  await discardUnsavedImage({ id: business.id, role: user.role }, publicId);
  return noContent();
});

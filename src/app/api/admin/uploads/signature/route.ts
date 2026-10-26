import { z } from "zod";
import { requireOwner, requireSession } from "@/server/auth/session";
import { signUpload, uploadTargets } from "@/server/cloudinary";
import { handle, json, parseJson } from "@/server/http";

const schema = z.object({ target: z.enum(uploadTargets) });

export const POST = handle(async (request) => {
  const { business } = await requireSession();
  const { target } = await parseJson(request, schema);
  // Logo and header are business data: owner only.
  if (target === "logo" || target === "header") await requireOwner();
  return json(signUpload(business.id, target));
});

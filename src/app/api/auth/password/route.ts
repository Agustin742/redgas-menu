import { changePassword, changePasswordSchema } from "@/server/auth/service";
import { requireSession } from "@/server/auth/session";
import { handle, noContent, parseJson } from "@/server/http";

export const POST = handle(async (request) => {
  const session = await requireSession();
  const input = await parseJson(request, changePasswordSchema);
  await changePassword(session, input);
  return noContent();
});

import { clearSessionCookie } from "@/server/auth/session";
import { handle, noContent } from "@/server/http";

export const POST = handle(async () => {
  await clearSessionCookie();
  return noContent();
});

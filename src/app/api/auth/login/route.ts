import { handle, json, parseJson } from "@/server/http";
import { getClientIp } from "@/server/auth/rate-limit";
import { login, loginSchema } from "@/server/auth/service";

export const POST = handle(async (request) => {
  const input = await parseJson(request, loginSchema);
  return json(await login(input, getClientIp(request)));
});

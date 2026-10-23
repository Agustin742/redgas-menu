import { requireSession } from "@/server/auth/session";
import {
  listOpeningHours,
  openingHoursSchema,
  replaceOpeningHours,
} from "@/server/business/service";
import { handle, json, parseJson, revalidateMenu } from "@/server/http";

export const GET = handle(async () => {
  const { business } = await requireSession();
  return json({ hours: await listOpeningHours(business.id) });
});

export const PUT = handle(async (request) => {
  const { business } = await requireSession();
  const input = await parseJson(request, openingHoursSchema);
  const hours = await replaceOpeningHours(business.id, input);
  revalidateMenu(business.slug);
  return json({ hours });
});

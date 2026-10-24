import { requireOwner } from "@/server/auth/session";
import {
  getBusiness,
  updateBusiness,
  updateBusinessSchema,
} from "@/server/business/service";
import { handle, json, parseJson, revalidateMenu } from "@/server/http";

export const GET = handle(async () => {
  const { business } = await requireOwner();
  return json(await getBusiness(business.id));
});

export const PATCH = handle(async (request) => {
  const { business } = await requireOwner();
  const input = await parseJson(request, updateBusinessSchema);
  const updated = await updateBusiness(business.id, input);
  revalidateMenu(business.slug);
  return json(updated);
});

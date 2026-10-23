import { requireSession } from "@/server/auth/session";
import { handle, json, parseJson, revalidateMenu } from "@/server/http";
import { reorderPromotions } from "@/server/promotions/service";
import { orderSchema } from "@/server/validation";

export const PUT = handle(async (request) => {
  const { business } = await requireSession();
  const { ids } = await parseJson(request, orderSchema);
  const promotions = await reorderPromotions(business.id, ids);
  revalidateMenu(business.slug);
  return json(promotions);
});

import { requireSession } from "@/server/auth/session";
import { reorderCategories } from "@/server/categories/service";
import { handle, json, parseJson, revalidateMenu } from "@/server/http";
import { orderSchema } from "@/server/validation";

export const PUT = handle(async (request) => {
  const { business } = await requireSession();
  const { ids } = await parseJson(request, orderSchema);
  const categories = await reorderCategories(business.id, ids);
  revalidateMenu(business.slug);
  return json(categories);
});

import { requireSession } from "@/server/auth/session";
import { handle, json, parseJson, revalidateMenu } from "@/server/http";
import { productOrderSchema, reorderProducts } from "@/server/products/service";

export const PUT = handle(async (request) => {
  const { business } = await requireSession();
  const { categoryId, ids } = await parseJson(request, productOrderSchema);
  const products = await reorderProducts(business.id, categoryId, ids);
  revalidateMenu(business.slug);
  return json(products);
});

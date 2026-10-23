import { requireSession } from "@/server/auth/session";
import {
  handle,
  json,
  noContent,
  parseJson,
  revalidateMenu,
} from "@/server/http";
import {
  deletePromotion,
  updatePromotion,
  updatePromotionSchema,
} from "@/server/promotions/service";

type Context = { params: Promise<{ id: string }> };

export const PATCH = handle(async (request, { params }: Context) => {
  const { business } = await requireSession();
  const { id } = await params;
  const input = await parseJson(request, updatePromotionSchema);
  const promotion = await updatePromotion(business.id, id, input);
  revalidateMenu(business.slug);
  return json(promotion);
});

export const DELETE = handle(async (_request, { params }: Context) => {
  const { business } = await requireSession();
  const { id } = await params;
  await deletePromotion(business.id, id);
  revalidateMenu(business.slug);
  return noContent();
});

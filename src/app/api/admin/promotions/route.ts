import { requireSession } from "@/server/auth/session";
import { handle, json, parseJson, revalidateMenu } from "@/server/http";
import {
  createPromotion,
  createPromotionSchema,
  listPromotions,
} from "@/server/promotions/service";

export const GET = handle(async () => {
  const { business } = await requireSession();
  return json(await listPromotions(business.id));
});

export const POST = handle(async (request) => {
  const { business } = await requireSession();
  const input = await parseJson(request, createPromotionSchema);
  const promotion = await createPromotion(business.id, input);
  revalidateMenu(business.slug);
  return json(promotion, { status: 201 });
});

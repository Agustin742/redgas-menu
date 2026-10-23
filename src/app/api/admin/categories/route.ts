import { requireSession } from "@/server/auth/session";
import {
  createCategory,
  createCategorySchema,
  listCategories,
} from "@/server/categories/service";
import { handle, json, parseJson, revalidateMenu } from "@/server/http";

export const GET = handle(async () => {
  const { business } = await requireSession();
  return json(await listCategories(business.id));
});

export const POST = handle(async (request) => {
  const { business } = await requireSession();
  const input = await parseJson(request, createCategorySchema);
  const category = await createCategory(business.id, input);
  revalidateMenu(business.slug);
  return json(category, { status: 201 });
});

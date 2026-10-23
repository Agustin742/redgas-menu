import { requireSession } from "@/server/auth/session";
import {
  deleteCategory,
  updateCategory,
  updateCategorySchema,
} from "@/server/categories/service";
import {
  handle,
  json,
  noContent,
  parseJson,
  revalidateMenu,
} from "@/server/http";

type Context = { params: Promise<{ id: string }> };

export const PATCH = handle(async (request, { params }: Context) => {
  const { business } = await requireSession();
  const { id } = await params;
  const input = await parseJson(request, updateCategorySchema);
  const category = await updateCategory(business.id, id, input);
  revalidateMenu(business.slug);
  return json(category);
});

export const DELETE = handle(async (_request, { params }: Context) => {
  const { business } = await requireSession();
  const { id } = await params;
  await deleteCategory(business.id, id);
  revalidateMenu(business.slug);
  return noContent();
});

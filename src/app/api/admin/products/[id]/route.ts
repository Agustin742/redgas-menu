import { requireSession } from "@/server/auth/session";
import {
  handle,
  json,
  noContent,
  parseJson,
  revalidateMenu,
} from "@/server/http";
import {
  deleteProduct,
  updateProduct,
  updateProductSchema,
} from "@/server/products/service";

type Context = { params: Promise<{ id: string }> };

export const PATCH = handle(async (request, { params }: Context) => {
  const { business } = await requireSession();
  const { id } = await params;
  const input = await parseJson(request, updateProductSchema);
  const product = await updateProduct(business.id, id, input);
  revalidateMenu(business.slug);
  return json(product);
});

export const DELETE = handle(async (_request, { params }: Context) => {
  const { business } = await requireSession();
  const { id } = await params;
  await deleteProduct(business.id, id);
  revalidateMenu(business.slug);
  return noContent();
});

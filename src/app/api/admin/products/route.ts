import { requireSession } from "@/server/auth/session";
import {
  handle,
  json,
  parse,
  parseJson,
  revalidateMenu,
} from "@/server/http";
import {
  createProduct,
  createProductSchema,
  listProducts,
  productListQuerySchema,
} from "@/server/products/service";

export const GET = handle(async (request) => {
  const { business } = await requireSession();
  const { searchParams } = new URL(request.url);
  const { categoryId } = parse(productListQuerySchema, {
    categoryId: searchParams.get("categoryId") ?? undefined,
  });
  return json(await listProducts(business.id, categoryId));
});

export const POST = handle(async (request) => {
  const { business } = await requireSession();
  const input = await parseJson(request, createProductSchema);
  const product = await createProduct(business.id, input);
  revalidateMenu(business.slug);
  return json(product, { status: 201 });
});

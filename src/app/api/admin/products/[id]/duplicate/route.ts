import { requireSession } from "@/server/auth/session";
import { handle, json, revalidateMenu } from "@/server/http";
import { duplicateProduct } from "@/server/products/service";

type Context = { params: Promise<{ id: string }> };

export const POST = handle(async (_request, { params }: Context) => {
  const { business } = await requireSession();
  const { id } = await params;
  const product = await duplicateProduct(business.id, id);
  revalidateMenu(business.slug);
  return json(product, { status: 201 });
});

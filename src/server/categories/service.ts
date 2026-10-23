import { z } from "zod";
import { prisma } from "@/lib/db";
import { HttpError } from "@/server/http";
import { assertSameIds, hasChanges, notFound } from "@/server/validation";

const name = z.string().trim().min(1).max(80);

export const createCategorySchema = z.object({
  name,
  isVisible: z.boolean().default(true),
});

export const updateCategorySchema = z
  .object({ name: name.optional(), isVisible: z.boolean().optional() })
  .refine(hasChanges, "At least one field is required");

export function listCategories(businessId: string) {
  return prisma.category.findMany({
    where: { businessId },
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function createCategory(
  businessId: string,
  input: z.infer<typeof createCategorySchema>,
) {
  const last = await prisma.category.aggregate({
    where: { businessId },
    _max: { position: true },
  });
  return prisma.category.create({
    data: { ...input, businessId, position: (last._max.position ?? -1) + 1 },
  });
}

export async function updateCategory(
  businessId: string,
  id: string,
  input: z.infer<typeof updateCategorySchema>,
) {
  const { count } = await prisma.category.updateMany({
    where: { id, businessId },
    data: input,
  });
  if (count === 0) notFound("Category");
  return prisma.category.findFirstOrThrow({ where: { id, businessId } });
}

export async function deleteCategory(businessId: string, id: string) {
  const category = await prisma.category.findFirst({
    where: { id, businessId },
    select: { _count: { select: { products: true } } },
  });
  if (!category) notFound("Category");
  if (category._count.products > 0) {
    throw new HttpError(
      409,
      "category_not_empty",
      "Move or delete the category's products first",
    );
  }
  await prisma.category.deleteMany({ where: { id, businessId } });
}

export async function reorderCategories(businessId: string, ids: string[]) {
  const existing = await prisma.category.findMany({
    where: { businessId },
    select: { id: true },
  });
  assertSameIds(
    ids,
    existing.map((category) => category.id),
  );
  await prisma.$transaction(
    ids.map((id, position) =>
      prisma.category.updateMany({
        where: { id, businessId },
        data: { position },
      }),
    ),
  );
  return listCategories(businessId);
}

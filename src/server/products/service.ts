import { z } from "zod";
import { prisma } from "@/lib/db";
import { releaseImage, resolveImageRef } from "@/server/cloudinary";
import { HttpError } from "@/server/http";
import {
  assertSameIds,
  hasChanges,
  idSchema,
  imageUrlSchema,
  notFound,
  publicIdSchema,
} from "@/server/validation";

const fields = {
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300),
  priceCents: z.number().int().min(0).max(100_000_000),
  categoryId: idSchema,
  imageUrl: imageUrlSchema.nullish(),
  imageAlt: z.string().trim().max(160).nullish(),
  imagePublicId: publicIdSchema.nullish(),
  isAvailable: z.boolean(),
  isFeatured: z.boolean(),
};

export const createProductSchema = z.object({
  ...fields,
  description: fields.description.default(""),
  isAvailable: fields.isAvailable.default(true),
  isFeatured: fields.isFeatured.default(false),
});

export const updateProductSchema = z
  .object(fields)
  .partial()
  .refine(hasChanges, "At least one field is required");

export const productOrderSchema = z.object({
  categoryId: idSchema,
  ids: z.array(idSchema).max(500),
});

export const productListQuerySchema = z.object({
  categoryId: idSchema.optional(),
});

/** An image needs alt text; clearing the image clears the alt text too. */
function resolveImage(imageUrl?: string | null, imageAlt?: string | null) {
  if (!imageUrl) return { imageUrl: null, imageAlt: null };
  if (!imageAlt) {
    throw new HttpError(
      400,
      "validation_error",
      "Invalid request data",
      [{ path: "imageAlt", message: "imageAlt is required when imageUrl is set" }],
    );
  }
  return { imageUrl, imageAlt };
}

async function assertCategory(businessId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, businessId },
    select: { id: true },
  });
  if (!category) notFound("Category");
}

async function nextPosition(businessId: string, categoryId: string) {
  const last = await prisma.product.aggregate({
    where: { businessId, categoryId },
    _max: { position: true },
  });
  return (last._max.position ?? -1) + 1;
}

export function listProducts(businessId: string, categoryId?: string) {
  return prisma.product.findMany({
    where: { businessId, ...(categoryId ? { categoryId } : {}) },
    orderBy: [{ category: { position: "asc" } }, { position: "asc" }],
  });
}

export async function createProduct(
  businessId: string,
  input: z.infer<typeof createProductSchema>,
) {
  await assertCategory(businessId, input.categoryId);
  const { imageUrl, imageAlt, imagePublicId, ...rest } = input;
  const publicId = resolveImageRef(businessId, imageUrl, imagePublicId);
  return prisma.product.create({
    data: {
      ...rest,
      ...resolveImage(imageUrl, imageAlt),
      imagePublicId: publicId ?? null,
      businessId,
      position: await nextPosition(businessId, input.categoryId),
    },
  });
}

export async function updateProduct(
  businessId: string,
  id: string,
  input: z.infer<typeof updateProductSchema>,
) {
  const current = await prisma.product.findFirst({ where: { id, businessId } });
  if (!current) notFound("Product");

  const { imageUrl, imageAlt, imagePublicId, categoryId, ...rest } = input;
  const publicId = resolveImageRef(
    businessId,
    imageUrl,
    imagePublicId,
    current.imageUrl,
  );
  const imageTouched = imageUrl !== undefined || imageAlt !== undefined;
  const moved = categoryId !== undefined && categoryId !== current.categoryId;
  if (moved) await assertCategory(businessId, categoryId);

  await prisma.product.update({
    where: { id },
    data: {
      ...rest,
      ...(imageTouched
        ? resolveImage(
            imageUrl !== undefined ? imageUrl : current.imageUrl,
            imageAlt !== undefined ? imageAlt : current.imageAlt,
          )
        : {}),
      ...(publicId !== undefined ? { imagePublicId: publicId } : {}),
      ...(moved
        ? { categoryId, position: await nextPosition(businessId, categoryId) }
        : {}),
    },
  });
  if (current.imagePublicId && publicId !== undefined && publicId !== current.imagePublicId) {
    await releaseImage(current.imagePublicId);
  }
  return prisma.product.findFirstOrThrow({ where: { id, businessId } });
}

export async function deleteProduct(businessId: string, id: string) {
  const current = await prisma.product.findFirst({
    where: { id, businessId },
    select: { imagePublicId: true },
  });
  if (!current) notFound("Product");
  await prisma.product.deleteMany({ where: { id, businessId } });
  if (current.imagePublicId) await releaseImage(current.imagePublicId);
}

export async function duplicateProduct(businessId: string, id: string) {
  const source = await prisma.product.findFirst({ where: { id, businessId } });
  if (!source) notFound("Product");
  const suffix = " (copia)";
  return prisma.product.create({
    data: {
      businessId,
      categoryId: source.categoryId,
      name: `${source.name.slice(0, 80 - suffix.length)}${suffix}`,
      description: source.description,
      priceCents: source.priceCents,
      imageUrl: source.imageUrl,
      imageAlt: source.imageAlt,
      imagePublicId: source.imagePublicId,
      isAvailable: false,
      isFeatured: source.isFeatured,
      position: await nextPosition(businessId, source.categoryId),
    },
  });
}

export async function reorderProducts(
  businessId: string,
  categoryId: string,
  ids: string[],
) {
  await assertCategory(businessId, categoryId);
  const existing = await prisma.product.findMany({
    where: { businessId, categoryId },
    select: { id: true },
  });
  assertSameIds(
    ids,
    existing.map((product) => product.id),
  );
  await prisma.$transaction(
    ids.map((productId, position) =>
      prisma.product.updateMany({
        where: { id: productId, businessId, categoryId },
        data: { position },
      }),
    ),
  );
  return listProducts(businessId, categoryId);
}

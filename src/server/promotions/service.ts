import { z } from "zod";
import { prisma } from "@/lib/db";
import { releaseImage, resolveImageRef } from "@/server/cloudinary";
import { HttpError } from "@/server/http";
import {
  assertSameIds,
  hasChanges,
  imageUrlSchema,
  notFound,
  publicIdSchema,
} from "@/server/validation";

const date = z.iso.datetime({ offset: true }).transform((v) => new Date(v));

const fields = {
  imageUrl: imageUrlSchema,
  imageAlt: z.string().trim().min(1).max(160),
  imagePublicId: publicIdSchema.nullish(),
  isActive: z.boolean(),
  startsAt: date.nullish(),
  endsAt: date.nullish(),
};

export const createPromotionSchema = z.object({
  ...fields,
  isActive: fields.isActive.default(true),
});

export const updatePromotionSchema = z
  .object(fields)
  .partial()
  .refine(hasChanges, "At least one field is required");

function assertRange(startsAt?: Date | null, endsAt?: Date | null) {
  if (startsAt && endsAt && endsAt <= startsAt) {
    throw new HttpError(400, "validation_error", "Invalid request data", [
      { path: "endsAt", message: "endsAt must be after startsAt" },
    ]);
  }
}

export function listPromotions(businessId: string) {
  return prisma.promotion.findMany({
    where: { businessId },
    orderBy: { position: "asc" },
  });
}

export async function createPromotion(
  businessId: string,
  input: z.infer<typeof createPromotionSchema>,
) {
  assertRange(input.startsAt, input.endsAt);
  const publicId = resolveImageRef(
    businessId,
    input.imageUrl,
    input.imagePublicId,
  );
  const last = await prisma.promotion.aggregate({
    where: { businessId },
    _max: { position: true },
  });
  return prisma.promotion.create({
    data: {
      ...input,
      imagePublicId: publicId ?? null,
      businessId,
      position: (last._max.position ?? -1) + 1,
    },
  });
}

export async function updatePromotion(
  businessId: string,
  id: string,
  input: z.infer<typeof updatePromotionSchema>,
) {
  const current = await prisma.promotion.findFirst({ where: { id, businessId } });
  if (!current) notFound("Promotion");
  assertRange(
    input.startsAt !== undefined ? input.startsAt : current.startsAt,
    input.endsAt !== undefined ? input.endsAt : current.endsAt,
  );
  const publicId = resolveImageRef(
    businessId,
    input.imageUrl,
    input.imagePublicId,
    current.imageUrl,
  );
  const updated = await prisma.promotion.update({
    where: { id },
    data: { ...input, imagePublicId: publicId },
  });
  if (current.imagePublicId && publicId !== undefined && publicId !== current.imagePublicId) {
    await releaseImage(current.imagePublicId);
  }
  return updated;
}

export async function deletePromotion(businessId: string, id: string) {
  const current = await prisma.promotion.findFirst({
    where: { id, businessId },
    select: { imagePublicId: true },
  });
  if (!current) notFound("Promotion");
  await prisma.promotion.deleteMany({ where: { id, businessId } });
  if (current.imagePublicId) await releaseImage(current.imagePublicId);
}

export async function reorderPromotions(businessId: string, ids: string[]) {
  const existing = await prisma.promotion.findMany({
    where: { businessId },
    select: { id: true },
  });
  assertSameIds(
    ids,
    existing.map((promotion) => promotion.id),
  );
  await prisma.$transaction(
    ids.map((id, position) =>
      prisma.promotion.updateMany({
        where: { id, businessId },
        data: { position },
      }),
    ),
  );
  return listPromotions(businessId);
}

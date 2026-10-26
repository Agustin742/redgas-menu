import { z } from "zod";
import { prisma } from "@/lib/db";
import { SocialPlatform } from "@/generated/prisma/enums";
import { releaseImage, resolveImageRef } from "@/server/cloudinary";
import { hasChanges, imageUrlSchema, publicIdSchema } from "@/server/validation";

const businessFields = {
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500),
  location: z.string().trim().min(1).max(160),
  logoUrl: imageUrlSchema,
  headerImageUrl: imageUrlSchema,
  logoPublicId: publicIdSchema.nullish(),
  headerImagePublicId: publicIdSchema.nullish(),
  contactEmail: z.email().max(254).nullable(),
};

// The slug is intentionally not editable here: it is part of the public URL.
export const updateBusinessSchema = z
  .object(businessFields)
  .partial()
  .refine(hasChanges, "At least one field is required");

export const socialLinksSchema = z.object({
  links: z
    .array(
      z.object({
        platform: z.enum(SocialPlatform),
        handle: z.string().trim().min(1).max(100),
        url: z.url({ protocol: /^https?$/ }).max(2048).nullish(),
      }),
    )
    .max(10),
});

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:mm");

export const openingHoursSchema = z.object({
  hours: z
    .array(
      z
        .object({
          dayOfWeek: z.number().int().min(0).max(6),
          opensAt: time,
          closesAt: time,
        })
        .refine((slot) => slot.closesAt > slot.opensAt, {
          path: ["closesAt"],
          message: "closesAt must be after opensAt",
        }),
    )
    .max(70)
    .superRefine((hours, ctx) => {
      // Zero-padded HH:mm strings sort chronologically.
      const sorted = hours
        .map((slot, index) => ({ ...slot, index }))
        .sort((a, b) =>
          a.dayOfWeek - b.dayOfWeek || a.opensAt.localeCompare(b.opensAt),
        );
      sorted.forEach((slot, i) => {
        const previous = sorted[i - 1];
        if (
          previous &&
          previous.dayOfWeek === slot.dayOfWeek &&
          slot.opensAt < previous.closesAt
        ) {
          ctx.addIssue({
            code: "custom",
            path: [slot.index, "opensAt"],
            message: "Ranges for the same day must not overlap",
          });
        }
      });
    }),
});

const businessSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  location: true,
  logoUrl: true,
  headerImageUrl: true,
  logoPublicId: true,
  headerImagePublicId: true,
  contactEmail: true,
  updatedAt: true,
} as const;

export function getBusiness(businessId: string) {
  return prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: businessSelect,
  });
}

export async function updateBusiness(
  businessId: string,
  input: z.infer<typeof updateBusinessSchema>,
) {
  const current = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: businessSelect,
  });
  const logoId = resolveImageRef(
    businessId,
    input.logoUrl,
    input.logoPublicId,
    current.logoUrl,
  );
  const headerId = resolveImageRef(
    businessId,
    input.headerImageUrl,
    input.headerImagePublicId,
    current.headerImageUrl,
  );
  const updated = await prisma.business.update({
    where: { id: businessId },
    data: { ...input, logoPublicId: logoId, headerImagePublicId: headerId },
    select: businessSelect,
  });
  for (const [previous, next] of [
    [current.logoPublicId, logoId],
    [current.headerImagePublicId, headerId],
  ] as const) {
    if (previous && next !== undefined && next !== previous) {
      await releaseImage(previous);
    }
  }
  return updated;
}

export function listSocialLinks(businessId: string) {
  return prisma.socialLink.findMany({
    where: { businessId },
    orderBy: { position: "asc" },
  });
}

export async function replaceSocialLinks(
  businessId: string,
  input: z.infer<typeof socialLinksSchema>,
) {
  const [, , links] = await prisma.$transaction([
    prisma.socialLink.deleteMany({ where: { businessId } }),
    prisma.socialLink.createMany({
      data: input.links.map((link, position) => ({
        ...link,
        businessId,
        position,
      })),
    }),
    prisma.socialLink.findMany({
      where: { businessId },
      orderBy: { position: "asc" },
    }),
  ]);
  return links;
}

export function listOpeningHours(businessId: string) {
  return prisma.openingHours.findMany({
    where: { businessId },
    orderBy: [{ dayOfWeek: "asc" }, { opensAt: "asc" }],
  });
}

export async function replaceOpeningHours(
  businessId: string,
  input: z.infer<typeof openingHoursSchema>,
) {
  const [, , hours] = await prisma.$transaction([
    prisma.openingHours.deleteMany({ where: { businessId } }),
    prisma.openingHours.createMany({
      data: input.hours.map((slot) => ({ ...slot, businessId })),
    }),
    prisma.openingHours.findMany({
      where: { businessId },
      orderBy: [{ dayOfWeek: "asc" }, { opensAt: "asc" }],
    }),
  ]);
  return hours;
}

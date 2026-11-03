import { cache } from "react";
import { prisma } from "@/lib/db";
import { mapPublicMenu, type PublicMenu } from "./mapper";

/**
 * Public read: only visible categories, available products and promotions
 * that are active and inside their [startsAt, endsAt] window (null = open).
 * Wrapped in cache() so metadata and page share one query per request.
 */
export const getPublicMenu = cache(
  async (slug: string): Promise<PublicMenu | null> => {
    const now = new Date();
    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        categories: {
          where: { isVisible: true },
          orderBy: { position: "asc" },
          include: {
            products: {
              where: { isAvailable: true },
              orderBy: { position: "asc" },
            },
          },
        },
        promotions: {
          where: {
            isActive: true,
            AND: [
              { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
              { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
            ],
          },
          orderBy: { position: "asc" },
        },
        socialLinks: { orderBy: { position: "asc" } },
        openingHours: true,
      },
    });
    if (!business) return null;

    return mapPublicMenu({
      business,
      categories: business.categories,
      promotions: business.promotions,
      socialLinks: business.socialLinks,
      openingHours: business.openingHours,
    });
  },
);

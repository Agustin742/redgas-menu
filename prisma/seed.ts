import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";
import {
  redGasBusiness,
  redGasFooter,
} from "../src/features/menu/mock-business";
import { redGasCategories } from "../src/features/menu/mock-categories";
import { redGasMockProducts } from "../src/features/menu/mock-products";
import { redGasPromotions } from "../src/features/menu/mock-promotions";

const SLUG = "red-gas";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Set it in .env before seeding.`);
  return value;
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: requireEnv("DIRECT_URL") }),
});

async function main() {
  const ownerEmail = requireEnv("SEED_OWNER_EMAIL");
  const passwordHash = await hashPassword(requireEnv("SEED_OWNER_PASSWORD"));

  await prisma.$transaction(async (tx) => {
    const businessData = {
      name: redGasBusiness.name,
      description: redGasBusiness.description,
      location: redGasBusiness.location,
      logoUrl: redGasBusiness.logoImage,
      headerImageUrl: redGasBusiness.headerBackgroundImage,
      contactEmail: redGasFooter.contactEmail,
    };
    const business = await tx.business.upsert({
      where: { slug: SLUG },
      update: businessData,
      create: { slug: SLUG, ...businessData },
    });
    const businessId = business.id;

    // Recreate children so re-running the seed converges to the mock data.
    await tx.product.deleteMany({ where: { businessId } });
    await tx.category.deleteMany({ where: { businessId } });
    await tx.promotion.deleteMany({ where: { businessId } });
    await tx.socialLink.deleteMany({ where: { businessId } });
    await tx.openingHours.deleteMany({ where: { businessId } });

    const createdCategories = await tx.category.createManyAndReturn({
      data: redGasCategories.map((category, position) => ({
        businessId,
        name: category.name,
        position,
      })),
    });
    const categoryIds = new Map(
      redGasCategories.map((category) => [
        category.id,
        createdCategories.find((created) => created.name === category.name)!.id,
      ]),
    );

    const nextPosition = new Map<string, number>();
    await tx.product.createMany({
      data: redGasMockProducts.map((product) => {
        const categoryId = categoryIds.get(product.categoryId);
        if (!categoryId) throw new Error(`Unknown category ${product.categoryId}`);
        const position = nextPosition.get(categoryId) ?? 0;
        nextPosition.set(categoryId, position + 1);
        return {
          businessId,
          categoryId,
          name: product.name,
          description: product.description,
          priceCents: product.priceInArs * 100,
          isFeatured: product.featured,
          imageUrl: product.image ?? null,
          imageAlt: product.imageAlt ?? null,
          position,
        };
      }),
    });

    await tx.promotion.createMany({
      data: redGasPromotions.map((promotion, position) => ({
        businessId,
        imageUrl: promotion.image,
        imageAlt: promotion.imageAlt,
        position,
      })),
    });

    const platforms = { Instagram: "INSTAGRAM", Facebook: "FACEBOOK" } as const;
    await tx.socialLink.createMany({
      data: redGasFooter.socials.map((social, position) => ({
        businessId,
        platform: platforms[social.name as keyof typeof platforms],
        handle: social.handle,
        url: null,
        position,
      })),
    });

    // Mock hours: "Todos los días · 8:00 a 20:00".
    await tx.openingHours.createMany({
      data: Array.from({ length: 7 }, (_, dayOfWeek) => ({
        businessId,
        dayOfWeek,
        opensAt: "08:00",
        closesAt: "20:00",
      })),
    });

    await tx.user.upsert({
      where: { email: ownerEmail },
      update: { businessId, passwordHash, role: "OWNER" },
      create: {
        businessId,
        email: ownerEmail,
        name: `${redGasBusiness.name} owner`,
        passwordHash,
        role: "OWNER",
      },
    });
  }, { maxWait: 10_000, timeout: 30_000 });

  console.log(`Seeded "${SLUG}".`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

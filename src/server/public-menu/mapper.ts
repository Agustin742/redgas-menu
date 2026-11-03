import type {
  MenuBusiness,
  MenuCategory,
  MenuFooterData,
  MenuProduct,
  MenuPromotion,
} from "@/features/menu/types";

export type SocialPlatformName =
  | "INSTAGRAM"
  | "FACEBOOK"
  | "TIKTOK"
  | "WHATSAPP"
  | "X"
  | "WEBSITE";

export type PublicBusinessRow = {
  name: string;
  description: string;
  location: string;
  logoUrl: string;
  headerImageUrl: string;
  contactEmail: string | null;
};

export type PublicCategoryRow = {
  id: string;
  name: string;
  products: {
    id: string;
    name: string;
    description: string;
    priceCents: number;
    imageUrl: string | null;
    imageAlt: string | null;
    isFeatured: boolean;
  }[];
};

export type PublicPromotionRow = {
  id: string;
  imageUrl: string;
  imageAlt: string;
};

export type PublicSocialRow = { platform: SocialPlatformName; handle: string };

export type OpeningHoursRow = {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
};

export type PublicMenuRows = {
  business: PublicBusinessRow;
  categories: PublicCategoryRow[];
  promotions: PublicPromotionRow[];
  socialLinks: PublicSocialRow[];
  openingHours: OpeningHoursRow[];
};

export type PublicMenu = {
  business: MenuBusiness;
  footer: MenuFooterData;
  promotions: MenuPromotion[];
  categories: MenuCategory[];
  products: MenuProduct[];
};

const SOCIAL_LABELS: Record<SocialPlatformName, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  WHATSAPP: "WhatsApp",
  X: "X",
  WEBSITE: "Sitio web",
};

export function socialLabel(platform: SocialPlatformName): string {
  return SOCIAL_LABELS[platform];
}

// Monday-first display order; dayOfWeek uses 0 = Sunday.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

const NO_HOURS_LABEL = "Horarios a confirmar";

function formatTime(value: string): string {
  const [hours, minutes] = value.split(":");
  return `${Number(hours)}:${minutes}`;
}

function formatRanges(rows: OpeningHoursRow[]): string {
  return [...rows]
    .sort((a, b) => a.opensAt.localeCompare(b.opensAt))
    .map((row) => `${formatTime(row.opensAt)} a ${formatTime(row.closesAt)}`)
    .join(" y ");
}

function dayRangeLabel(days: number[]): string {
  if (days.length === 7) return "Todos los días";
  const first = DAY_NAMES[days[0]];
  if (days.length === 1) return first;
  const last = DAY_NAMES[days[days.length - 1]].toLowerCase();
  return days.length === 2 ? `${first} y ${last}` : `${first} a ${last}`;
}

/**
 * Groups consecutive days (Monday to Sunday) that share identical hours,
 * e.g. "Lunes a viernes · 8:00 a 20:00 / Sábado y domingo · 9:00 a 13:00".
 */
export function formatOpeningHours(rows: OpeningHoursRow[]): string {
  if (rows.length === 0) return NO_HOURS_LABEL;

  const groups: { days: number[]; signature: string }[] = [];
  for (const day of DAY_ORDER) {
    const signature = formatRanges(rows.filter((row) => row.dayOfWeek === day));
    if (!signature) continue;
    const last = groups[groups.length - 1];
    const previousDay = last ? last.days[last.days.length - 1] : undefined;
    const isNext =
      previousDay !== undefined &&
      DAY_ORDER.indexOf(previousDay) + 1 === DAY_ORDER.indexOf(day);
    if (last && isNext && last.signature === signature) last.days.push(day);
    else groups.push({ days: [day], signature });
  }

  if (groups.length === 0) return NO_HOURS_LABEL;
  return groups
    .map((group) => `${dayRangeLabel(group.days)} · ${group.signature}`)
    .join(" / ");
}

export function mapPublicMenu(rows: PublicMenuRows): PublicMenu {
  const { business } = rows;
  const openingHours = formatOpeningHours(rows.openingHours);

  const categories = rows.categories.filter(
    (category) => category.products.length > 0,
  );

  const products: MenuProduct[] = categories.flatMap((category) =>
    category.products.map((product): MenuProduct => {
      const base = {
        id: product.id,
        categoryId: category.id,
        name: product.name,
        description: product.description,
        priceInArs: product.priceCents / 100,
        featured: product.isFeatured,
      };
      return product.imageUrl
        ? {
            ...base,
            image: product.imageUrl,
            imageAlt: product.imageAlt || product.name,
          }
        : base;
    }),
  );

  return {
    business: {
      name: business.name,
      description: business.description,
      location: business.location,
      openingHours,
      logoImage: business.logoUrl,
      headerBackgroundImage: business.headerImageUrl,
    },
    footer: {
      location: business.location,
      openingHours,
      contactEmail: business.contactEmail ?? "",
      socials: rows.socialLinks.map((link) => ({
        name: socialLabel(link.platform),
        handle: link.handle,
      })),
    },
    promotions: rows.promotions.map((promotion) => ({
      id: promotion.id,
      image: promotion.imageUrl,
      imageAlt: promotion.imageAlt,
    })),
    categories: categories.map(({ id, name }) => ({ id, name })),
    products,
  };
}

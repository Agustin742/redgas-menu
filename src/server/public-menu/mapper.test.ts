import {
  formatOpeningHours,
  mapPublicMenu,
  socialLabel,
  type OpeningHoursRow,
  type PublicMenuRows,
} from "./mapper";

const hours = (
  days: number[],
  opensAt: string,
  closesAt: string,
): OpeningHoursRow[] =>
  days.map((dayOfWeek) => ({ dayOfWeek, opensAt, closesAt }));

describe("formatOpeningHours", () => {
  it("matches the mock format when every day shares hours", () => {
    expect(
      formatOpeningHours(hours([0, 1, 2, 3, 4, 5, 6], "08:00", "20:00")),
    ).toBe("Todos los días · 8:00 a 20:00");
  });

  it("groups consecutive days and keeps different groups apart", () => {
    const rows = [
      ...hours([1, 2, 3, 4, 5], "08:00", "20:00"),
      ...hours([6, 0], "09:30", "13:00"),
    ];
    expect(formatOpeningHours(rows)).toBe(
      "Lunes a viernes · 8:00 a 20:00 / Sábado y domingo · 9:30 a 13:00",
    );
  });

  it("does not merge non-consecutive days and handles split shifts", () => {
    const rows = [
      ...hours([1, 3], "08:00", "12:00"),
      ...hours([1, 3], "16:00", "20:00"),
    ];
    expect(formatOpeningHours(rows)).toBe(
      "Lunes · 8:00 a 12:00 y 16:00 a 20:00 / Miércoles · 8:00 a 12:00 y 16:00 a 20:00",
    );
  });

  it("falls back when there are no hours", () => {
    expect(formatOpeningHours([])).toBe("Horarios a confirmar");
  });
});

describe("socialLabel", () => {
  it("maps platforms to display names", () => {
    expect(socialLabel("INSTAGRAM")).toBe("Instagram");
    expect(socialLabel("WEBSITE")).toBe("Sitio web");
  });
});

describe("mapPublicMenu", () => {
  const rows: PublicMenuRows = {
    business: {
      name: "Red Gas",
      description: "desc",
      location: "Salta",
      logoUrl: "https://img/logo.jpg",
      headerImageUrl: "https://img/header.jpg",
      contactEmail: null,
    },
    categories: [
      {
        id: "c1",
        name: "Cafés",
        products: [
          {
            id: "p1",
            name: "Latte",
            description: "d",
            priceCents: 345050,
            imageUrl: "https://img/p1.jpg",
            imageAlt: null,
            isFeatured: true,
          },
          {
            id: "p2",
            name: "Espresso",
            description: "d",
            priceCents: 200000,
            imageUrl: null,
            imageAlt: null,
            isFeatured: false,
          },
        ],
      },
      { id: "c2", name: "Vacía", products: [] },
    ],
    promotions: [
      { id: "pr1", imageUrl: "https://img/promo.jpg", imageAlt: "Promo" },
    ],
    socialLinks: [{ platform: "INSTAGRAM", handle: "@redgas" }],
    openingHours: hours([0, 1, 2, 3, 4, 5, 6], "08:00", "20:00"),
  };

  it("maps to the existing view types", () => {
    const menu = mapPublicMenu(rows);
    expect(menu.business.logoImage).toBe("https://img/logo.jpg");
    expect(menu.business.openingHours).toBe("Todos los días · 8:00 a 20:00");
    expect(menu.footer.contactEmail).toBe("");
    expect(menu.footer.socials).toEqual([
      { name: "Instagram", handle: "@redgas" },
    ]);
    expect(menu.promotions).toEqual([
      { id: "pr1", image: "https://img/promo.jpg", imageAlt: "Promo" },
    ]);
  });

  it("drops empty categories and converts cents to ARS", () => {
    const menu = mapPublicMenu(rows);
    expect(menu.categories).toEqual([{ id: "c1", name: "Cafés" }]);
    expect(menu.products[0]).toMatchObject({
      priceInArs: 3450.5,
      featured: true,
      image: "https://img/p1.jpg",
      imageAlt: "Latte",
    });
    expect(menu.products[1].image).toBeUndefined();
  });
});

export type MenuBusiness = {
  name: string;
  description: string;
  location: string;
  openingHours: string;
  logoImage: string;
  headerBackgroundImage: string;
};

export type MenuCategory = {
  id: string;
  name: string;
};

type MenuProductDetails = {
  id: string;
  categoryId: MenuCategory["id"];
  name: string;
  description: string;
  priceInArs: number;
  featured: boolean;
};

export type MenuProduct = MenuProductDetails &
  (
    | { image: string; imageAlt: string }
    | { image?: never; imageAlt?: never }
  );

export type MenuPromotion = {
  id: string;
  image: string;
  imageAlt: string;
};

export type MenuFooterData = {
  location: string;
  openingHours: string;
  contactEmail: string;
  socials: { name: string; handle: string }[];
};

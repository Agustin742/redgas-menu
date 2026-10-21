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

export type MenuProduct = {
  id: string;
  categoryId: MenuCategory["id"];
  name: string;
  description: string;
  priceInArs: number;
  image: string;
  imageAlt: string;
};

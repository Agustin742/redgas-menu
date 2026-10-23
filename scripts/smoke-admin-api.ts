// End-to-end smoke test for the admin API. Run against a started server:
//   pnpm start   (in another terminal)
//   pnpm smoke:api
// Uses SEED_OWNER_EMAIL / SEED_OWNER_PASSWORD from .env and restores all data it touches.
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DIRECT_URL! }),
});

let failures = 0;
function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) console.log(`  ok   ${label}`);
  else {
    failures += 1;
    console.log(`  FAIL ${label}`, detail ?? "");
  }
}

class Client {
  constructor(private cookie = "") {}

  async request(method: string, path: string, body?: unknown) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...(this.cookie ? { cookie: this.cookie } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) this.cookie = setCookie.split(";")[0];
    const text = await response.text();
    return { status: response.status, data: text ? JSON.parse(text) : null };
  }

  login(email: string, password: string) {
    return this.request("POST", "/api/auth/login", { email, password });
  }
}

type WithId = { id: string };

async function main() {
  const email = process.env.SEED_OWNER_EMAIL!;
  const password = process.env.SEED_OWNER_PASSWORD!;
  const owner = new Client();
  const anonymous = new Client();

  console.log("auth");
  check("anonymous admin request is 401", (await anonymous.request("GET", "/api/admin/categories")).status === 401);
  check("me without session is 401", (await anonymous.request("GET", "/api/auth/me")).status === 401);
  check("wrong password is 401", (await anonymous.login(email, `${password}-wrong`)).status === 401);
  check("unknown email is 401", (await anonymous.login("nobody@example.com", password)).status === 401);
  check("forged cookie is 401", (await new Client("session=eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.").request("GET", "/api/admin/categories")).status === 401);
  const login = await owner.login(email.toUpperCase(), password);
  check("login succeeds (case-insensitive email)", login.status === 200 && login.data?.business?.slug === "red-gas", login);
  check("me returns session", (await owner.request("GET", "/api/auth/me")).status === 200);
  check("invalid JSON body is 400", (await owner.request("POST", "/api/admin/categories", "{oops")).status === 400);

  console.log("categories");
  const originalCategories = (await owner.request("GET", "/api/admin/categories")).data as WithId[];
  check("lists 6 categories", originalCategories.length === 6, originalCategories.length);
  const created = await owner.request("POST", "/api/admin/categories", { name: "Smoke categoría" });
  check("creates category 201", created.status === 201, created);
  const category = created.data as WithId & { name: string };
  check("duplicate name is 409", (await owner.request("POST", "/api/admin/categories", { name: "Smoke categoría" })).status === 409);
  check("empty name is 400", (await owner.request("POST", "/api/admin/categories", { name: "" })).status === 400);
  const renamed = await owner.request("PATCH", `/api/admin/categories/${category.id}`, { name: "Smoke renombrada", isVisible: false });
  check("updates category", renamed.status === 200 && renamed.data.name === "Smoke renombrada", renamed);
  const reversed = [...originalCategories.map((c) => c.id), category.id].reverse();
  check("reorders categories", (await owner.request("PUT", "/api/admin/categories/order", { ids: reversed })).status < 300);
  check("reorder with missing ids is 400", (await owner.request("PUT", "/api/admin/categories/order", { ids: reversed.slice(1) })).status === 400);

  console.log("products");
  const product = await owner.request("POST", "/api/admin/products", {
    categoryId: category.id,
    name: "Smoke producto",
    description: "Prueba",
    priceCents: 123456,
  });
  check("creates product 201", product.status === 201 && product.data.priceCents === 123456, product);
  const productId = (product.data as WithId).id;
  check("negative price is 400", (await owner.request("POST", "/api/admin/products", { categoryId: category.id, name: "x", description: "", priceCents: -1 })).status === 400);
  check("javascript: image url is 400", (await owner.request("POST", "/api/admin/products", { categoryId: category.id, name: "x", description: "", priceCents: 1, imageUrl: "javascript:alert(1)", imageAlt: "x" })).status === 400);
  check("category with products cannot be deleted (409)", (await owner.request("DELETE", `/api/admin/categories/${category.id}`)).status === 409);
  const toggled = await owner.request("PATCH", `/api/admin/products/${productId}`, { isAvailable: false, priceCents: 99900 });
  check("updates product", toggled.status === 200 && toggled.data.isAvailable === false && toggled.data.priceCents === 99900, toggled);
  const duplicate = await owner.request("POST", `/api/admin/products/${productId}/duplicate`);
  check("duplicates product", duplicate.status === 201 && String(duplicate.data.name).includes("(copia)"), duplicate);
  const listed = (await owner.request("GET", `/api/admin/products?categoryId=${category.id}`)).data as WithId[];
  check("lists products by category", listed.length === 2, listed.length);
  check("reorders products", (await owner.request("PUT", "/api/admin/products/order", { categoryId: category.id, ids: listed.map((p) => p.id).reverse() })).status < 300);
  for (const item of listed) {
    check("deletes product", (await owner.request("DELETE", `/api/admin/products/${item.id}`)).status === 204);
  }
  check("deleted product is 404", (await owner.request("PATCH", `/api/admin/products/${productId}`, { name: "x" })).status === 404);

  console.log("promotions");
  const originalPromotions = (await owner.request("GET", "/api/admin/promotions")).data as WithId[];
  const promotion = await owner.request("POST", "/api/admin/promotions", { imageUrl: "/promo1-mockup.png", imageAlt: "Smoke promo" });
  check("creates promotion", promotion.status === 201, promotion);
  const promotionId = (promotion.data as WithId).id;
  check("endsAt before startsAt is 400", (await owner.request("PATCH", `/api/admin/promotions/${promotionId}`, { startsAt: "2026-12-10T00:00:00Z", endsAt: "2026-12-01T00:00:00Z" })).status === 400);
  check("reorders promotions", (await owner.request("PUT", "/api/admin/promotions/order", { ids: [promotionId, ...originalPromotions.map((p) => p.id)] })).status < 300);
  check("deletes promotion", (await owner.request("DELETE", `/api/admin/promotions/${promotionId}`)).status === 204);
  check("restores promotion order", (await owner.request("PUT", "/api/admin/promotions/order", { ids: originalPromotions.map((p) => p.id) })).status < 300);

  console.log("business");
  const business = (await owner.request("GET", "/api/admin/business")).data;
  const patched = await owner.request("PATCH", "/api/admin/business", { description: "Smoke descripción" });
  check("updates business profile", patched.status === 200 && patched.data.description === "Smoke descripción", patched);
  check("slug is not editable", (await owner.request("GET", "/api/admin/business")).data.slug === "red-gas");
  await owner.request("PATCH", "/api/admin/business", { description: business.description });
  const { links } = (await owner.request("GET", "/api/admin/business/social-links")).data as { links: { platform: string; handle: string; url: string | null }[] };
  check("replaces social links", (await owner.request("PUT", "/api/admin/business/social-links", { links: [{ platform: "TIKTOK", handle: "@smoke" }] })).status < 300);
  check("unknown platform is 400", (await owner.request("PUT", "/api/admin/business/social-links", { links: [{ platform: "MYSPACE", handle: "x" }] })).status === 400);
  await owner.request("PUT", "/api/admin/business/social-links", { links: links.map(({ platform, handle, url }) => ({ platform, handle, ...(url ? { url } : {}) })) });
  const { hours } = (await owner.request("GET", "/api/admin/business/opening-hours")).data as { hours: { dayOfWeek: number; opensAt: string; closesAt: string }[] };
  check("overlapping hours are 400", (await owner.request("PUT", "/api/admin/business/opening-hours", { hours: [{ dayOfWeek: 1, opensAt: "08:00", closesAt: "12:00" }, { dayOfWeek: 1, opensAt: "11:00", closesAt: "14:00" }] })).status === 400);
  check("closes before opens is 400", (await owner.request("PUT", "/api/admin/business/opening-hours", { hours: [{ dayOfWeek: 1, opensAt: "20:00", closesAt: "08:00" }] })).status === 400);
  check("replaces opening hours", (await owner.request("PUT", "/api/admin/business/opening-hours", { hours: hours.map(({ dayOfWeek, opensAt, closesAt }) => ({ dayOfWeek, opensAt, closesAt })) })).status < 300);

  console.log("tenant isolation");
  const intruderEmail = `smoke-intruder-${Date.now()}@example.com`;
  const intruderBusiness = await prisma.business.create({
    data: {
      slug: `smoke-${Date.now()}`,
      name: "Smoke Café",
      description: "",
      location: "",
      logoUrl: "/logo-red-gas-mockup.jpg",
      headerImageUrl: "/menu-header-background-mockup.png",
      users: { create: { email: intruderEmail, name: "Intruder", passwordHash: await hashPassword("intruder-password") } },
    },
  });
  try {
    const intruder = new Client();
    check("intruder logs in", (await intruder.login(intruderEmail, "intruder-password")).status === 200);
    check("intruder sees no categories", ((await intruder.request("GET", "/api/admin/categories")).data as unknown[]).length === 0);
    const victimId = originalCategories[0].id;
    check("intruder cannot edit foreign category (404)", (await intruder.request("PATCH", `/api/admin/categories/${victimId}`, { name: "hacked" })).status === 404);
    check("intruder cannot delete foreign category (404)", (await intruder.request("DELETE", `/api/admin/categories/${victimId}`)).status === 404);
    check("intruder cannot create product in foreign category", [400, 404].includes((await intruder.request("POST", "/api/admin/products", { categoryId: victimId, name: "x", description: "", priceCents: 1 })).status));
    check("intruder cannot delete foreign promotion (404)", (await intruder.request("DELETE", `/api/admin/promotions/${originalPromotions[0].id}`)).status === 404);
    check("intruder cannot reorder foreign categories", (await intruder.request("PUT", "/api/admin/categories/order", { ids: originalCategories.map((c) => c.id) })).status === 400);
  } finally {
    await prisma.business.delete({ where: { id: intruderBusiness.id } });
  }

  console.log("cleanup");
  check("deletes empty smoke category", (await owner.request("DELETE", `/api/admin/categories/${category.id}`)).status === 204);
  check("restores category order", (await owner.request("PUT", "/api/admin/categories/order", { ids: originalCategories.map((c) => c.id) })).status < 300);
  check("logout is 204", (await owner.request("POST", "/api/auth/logout")).status === 204);

  const counts = await prisma.business.findUnique({
    where: { slug: "red-gas" },
    select: { _count: { select: { categories: true, products: true, promotions: true, socialLinks: true, openingHours: true } } },
  });
  check("red-gas data restored", JSON.stringify(counts?._count) === JSON.stringify({ categories: 6, products: 18, promotions: 3, socialLinks: 2, openingHours: 7 }), counts?._count);

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

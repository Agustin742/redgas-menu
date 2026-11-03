import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  assertOwnedImage,
  discardUnsavedImage,
  uploadTargetOf,
  releaseImage,
  resolveImageRef,
  signUpload,
} from "@/server/cloudinary";

jest.mock("@/lib/db", () => ({
  prisma: {
    product: { count: jest.fn() },
    promotion: { count: jest.fn() },
    business: { count: jest.fn() },
  },
}));

const count = {
  product: prisma.product.count as unknown as jest.Mock,
  promotion: prisma.promotion.count as unknown as jest.Mock,
  business: prisma.business.count as unknown as jest.Mock,
};

const publicId = "coffee-menu/biz-1/product/abc123";
const url = `https://res.cloudinary.com/demo/image/upload/v1/${publicId}.jpg`;
const fetchMock = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();
  process.env.CLOUDINARY_CLOUD_NAME = "demo";
  process.env.CLOUDINARY_API_KEY = "key";
  process.env.CLOUDINARY_API_SECRET = "secret";
  global.fetch = fetchMock;
});

describe("signUpload", () => {
  test("signs sorted folder-scoped params with SHA-1 and the secret", () => {
    const signed = signUpload("biz-1", "product", 1700000000);
    expect(signed).toMatchObject({
      cloudName: "demo",
      apiKey: "key",
      timestamp: 1700000000,
      folder: "coffee-menu/biz-1/product",
      allowedFormats: "jpg,jpeg,png,webp,avif",
    });
    const payload =
      "allowed_formats=jpg,jpeg,png,webp,avif&folder=coffee-menu/biz-1/product&timestamp=1700000000secret";
    expect(signed.signature).toBe(
      createHash("sha1").update(payload).digest("hex"),
    );
  });

  test("503 uploads_unavailable when credentials are missing", () => {
    delete process.env.CLOUDINARY_API_SECRET;
    expect(() => signUpload("biz-1", "logo")).toThrow(
      expect.objectContaining({ status: 503, code: "uploads_unavailable" }),
    );
  });
});

describe("assertOwnedImage", () => {
  test("accepts an asset in the business folder with a matching URL", () => {
    expect(() => assertOwnedImage("biz-1", url, publicId)).not.toThrow();
  });

  test("rejects a public id from another business folder", () => {
    expect(() =>
      assertOwnedImage("biz-2", url, publicId),
    ).toThrow(expect.objectContaining({ status: 400, code: "validation_error" }));
  });

  test("rejects a URL from another cloud or one that omits the public id", () => {
    const foreign = url.replace("/demo/", "/other/");
    expect(() => assertOwnedImage("biz-1", foreign, publicId)).toThrow(
      expect.objectContaining({ status: 400 }),
    );
    const other = `https://res.cloudinary.com/demo/image/upload/v1/coffee-menu/biz-1/product/zzz.jpg`;
    expect(() => assertOwnedImage("biz-1", other, publicId)).toThrow(
      expect.objectContaining({ status: 400 }),
    );
  });

  test("rejects a URL that only mentions the public id elsewhere", () => {
    const smuggled = `https://res.cloudinary.com/demo/image/upload/v1/other.jpg?${publicId}`;
    expect(() => assertOwnedImage("biz-1", smuggled, publicId)).toThrow(
      expect.objectContaining({ status: 400 }),
    );
  });
});

describe("resolveImageRef", () => {
  test("a public id without its URL is rejected", () => {
    expect(() => resolveImageRef("biz-1", undefined, publicId)).toThrow(
      expect.objectContaining({ status: 400 }),
    );
  });

  test("plain URLs store null, clearing stores null, untouched stays undefined", () => {
    expect(resolveImageRef("biz-1", "/a.png", undefined)).toBeNull();
    expect(resolveImageRef("biz-1", null, undefined)).toBeNull();
    expect(resolveImageRef("biz-1", undefined, undefined)).toBeUndefined();
    expect(resolveImageRef("biz-1", "/a.png", undefined, "/a.png")).toBeUndefined();
  });
});

describe("releaseImage", () => {
  test("keeps the asset while another row still references it", async () => {
    count.product.mockResolvedValue(1);
    count.promotion.mockResolvedValue(0);
    count.business.mockResolvedValue(0);
    await releaseImage(publicId);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("destroys an unreferenced asset and never throws on failure", async () => {
    count.product.mockResolvedValue(0);
    count.promotion.mockResolvedValue(0);
    count.business.mockResolvedValue(0);
    fetchMock.mockRejectedValue(new Error("network"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(releaseImage(publicId)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.cloudinary.com/v1_1/demo/image/destroy",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("uploadTargetOf", () => {
  test("returns the target of an id inside the business folder", () => {
    expect(uploadTargetOf("biz-1", publicId)).toBe("product");
    expect(uploadTargetOf("biz-1", "coffee-menu/biz-1/logo/x")).toBe("logo");
  });

  test("rejects other businesses, unknown targets, traversal and bare folders", () => {
    expect(uploadTargetOf("biz-2", publicId)).toBeNull();
    expect(uploadTargetOf("biz-1", "coffee-menu/biz-1/other/x")).toBeNull();
    expect(uploadTargetOf("biz-1", "coffee-menu/biz-1/product/../../biz-2/product/x")).toBeNull();
    expect(uploadTargetOf("biz-1", "coffee-menu/biz-1/product/")).toBeNull();
    expect(uploadTargetOf("biz-1", "coffee-menu/biz-10/product/x")).toBeNull();
  });
});

describe("discardUnsavedImage", () => {
  const owner = { id: "biz-1", role: "OWNER" as const };
  const staff = { id: "biz-1", role: "STAFF" as const };

  function unreferenced() {
    count.product.mockResolvedValue(0);
    count.promotion.mockResolvedValue(0);
    count.business.mockResolvedValue(0);
    fetchMock.mockResolvedValue({ ok: true });
  }

  test("destroys an owned, unreferenced product image for any role", async () => {
    unreferenced();
    await expect(discardUnsavedImage(staff, publicId)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("is a no-op for an id outside the business folder", async () => {
    unreferenced();
    await expect(discardUnsavedImage(owner, "coffee-menu/biz-2/product/x")).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(count.product).not.toHaveBeenCalled();
  });

  test("is a no-op while a row still references the image", async () => {
    unreferenced();
    count.promotion.mockResolvedValue(1);
    await expect(discardUnsavedImage(owner, publicId)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("logo and header need the owner role", async () => {
    unreferenced();
    const logoId = "coffee-menu/biz-1/logo/abc";
    await expect(discardUnsavedImage(staff, logoId)).rejects.toMatchObject({
      status: 403,
      code: "forbidden",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(discardUnsavedImage(owner, logoId)).resolves.toBe(true);
  });
});

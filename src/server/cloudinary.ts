import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { HttpError } from "@/server/http";

/** Root folder shared by every business; each business gets its own subfolder. */
export const UPLOAD_ROOT = "coffee-menu";

export const uploadTargets = ["product", "promotion", "logo", "header"] as const;
export type UploadTarget = (typeof uploadTargets)[number];

const ALLOWED_FORMATS = "jpg,jpeg,png,webp,avif";

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret
    ? { cloudName, apiKey, apiSecret }
    : null;
}

export function isConfigured() {
  return config() !== null;
}

function requireConfig() {
  const current = config();
  if (!current) {
    throw new HttpError(
      503,
      "uploads_unavailable",
      "Image uploads are not configured",
    );
  }
  return current;
}

/**
 * Cloudinary signature: sorted "key=value" pairs joined by "&", the API secret
 * appended without separator, hashed with SHA-1 (hex).
 */
function sign(params: Record<string, string | number>, apiSecret: string) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(payload + apiSecret).digest("hex");
}

function businessFolder(businessId: string) {
  return `${UPLOAD_ROOT}/${businessId}`;
}

/**
 * Signs a direct browser upload. The folder and allowed formats are part of
 * the signature, so the client cannot upload elsewhere or non-image files.
 */
export function signUpload(
  businessId: string,
  target: UploadTarget,
  timestamp = Math.floor(Date.now() / 1000),
) {
  const { cloudName, apiKey, apiSecret } = requireConfig();
  const folder = `${businessFolder(businessId)}/${target}`;
  const signature = sign(
    { allowed_formats: ALLOWED_FORMATS, folder, timestamp },
    apiSecret,
  );
  return {
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
    allowedFormats: ALLOWED_FORMATS,
  };
}

function invalid(message: string): never {
  throw new HttpError(400, "validation_error", "Invalid request data", [
    { path: "imagePublicId", message },
  ]);
}

/** The public id must live in the business folder and match the delivery URL. */
export function assertOwnedImage(
  businessId: string,
  url: string,
  publicId: string,
) {
  const prefix = `${businessFolder(businessId)}/`;
  if (!publicId.startsWith(prefix) || publicId.includes("..")) {
    invalid("imagePublicId does not belong to this business");
  }
  const { cloudName } = requireConfig();
  // Exactly the upload's secure_url: optional version segment, then the id and extension.
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const deliveryUrl = new RegExp(
    `^https://res\\.cloudinary\\.com/${escape(cloudName)}/image/upload/(v\\d+/)?${escape(publicId)}\\.[a-z0-9]+$`,
  );
  if (!deliveryUrl.test(url)) {
    invalid("imageUrl does not match imagePublicId");
  }
}

/**
 * Validates an image reference sent with a write request.
 * Returns undefined when the image is untouched, otherwise the public id to
 * store (null for plain URLs and cleared images).
 */
export function resolveImageRef(
  businessId: string,
  url: string | null | undefined,
  publicId: string | null | undefined,
  currentUrl?: string | null,
) {
  if (publicId && !url) invalid("imagePublicId requires imageUrl");
  if (url === undefined) return undefined;
  if (!publicId) {
    // Re-sending the stored URL alone must not orphan its stored asset.
    return url !== null && url === currentUrl ? undefined : null;
  }
  assertOwnedImage(businessId, url!, publicId);
  return publicId;
}

/** Deletes an asset from Cloudinary; best-effort, never throws. */
export async function destroyImage(publicId: string) {
  try {
    const { cloudName, apiKey, apiSecret } = requireConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const body = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      api_key: apiKey,
      signature: sign({ public_id: publicId, timestamp }, apiSecret),
    });
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      { method: "POST", body },
    );
    if (!response.ok) {
      console.error("Cloudinary destroy failed", response.status, publicId);
    }
  } catch (error) {
    console.error("Cloudinary destroy failed", publicId, error);
  }
}

/** Destroys the asset unless another row (e.g. a duplicated product) uses it. */
export async function releaseImage(publicId: string) {
  try {
    const [products, promotions, businesses] = await Promise.all([
      prisma.product.count({ where: { imagePublicId: publicId } }),
      prisma.promotion.count({ where: { imagePublicId: publicId } }),
      prisma.business.count({
        where: {
          OR: [{ logoPublicId: publicId }, { headerImagePublicId: publicId }],
        },
      }),
    ]);
    if (products + promotions + businesses > 0) return;
    await destroyImage(publicId);
  } catch (error) {
    console.error("Releasing image failed", publicId, error);
  }
}

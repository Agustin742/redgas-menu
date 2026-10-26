import { z } from "zod";
import { HttpError } from "@/server/http";

/** Absolute http(s) URL or a same-site path such as "/images/logo.png". */
export const imageUrlSchema = z
  .union([z.url({ protocol: /^https?$/ }), z.string().regex(/^\/(?!\/)/)])
  .refine((value) => value.length <= 2048, "Must be at most 2048 characters");

/** Cloudinary public id; ownership is checked against the business folder. */
export const publicIdSchema = z.string().max(255);

export const idSchema = z.string().min(1).max(64);

export const orderSchema = z.object({ ids: z.array(idSchema).max(500) });

export function hasChanges(value: object) {
  return Object.values(value).some((entry) => entry !== undefined);
}

/** Ensures a reorder request lists exactly the existing ids, once each. */
export function assertSameIds(requested: string[], existing: string[]) {
  const known = new Set(existing);
  const valid =
    requested.length === existing.length &&
    new Set(requested).size === requested.length &&
    requested.every((id) => known.has(id));
  if (!valid) {
    throw new HttpError(
      400,
      "invalid_order",
      "ids must list every item exactly once",
    );
  }
}

export function notFound(what: string): never {
  throw new HttpError(404, "not_found", `${what} not found`);
}

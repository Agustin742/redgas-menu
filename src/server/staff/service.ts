import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { HttpError } from "@/server/http";
import type { Session } from "@/server/auth/session";
import { notFound } from "@/server/validation";

export const createStaffSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  name: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(200),
});

// Never select passwordHash.
const publicFields = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
} as const;

export function listStaff(businessId: string) {
  return prisma.user.findMany({
    where: { businessId },
    select: publicFields,
    orderBy: { createdAt: "asc" },
  });
}

export async function createStaff(
  businessId: string,
  input: z.infer<typeof createStaffSchema>,
) {
  // Emails are unique across all businesses, regardless of case.
  const existing = await prisma.user.findFirst({
    where: { email: { equals: input.email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) {
    throw new HttpError(409, "conflict", "That email is already registered");
  }
  return prisma.user.create({
    data: {
      businessId,
      email: input.email,
      name: input.name,
      role: "STAFF",
      passwordHash: await hashPassword(input.password),
    },
    select: publicFields,
  });
}

export async function removeStaff(session: Session, userId: string) {
  const target = await prisma.user.findFirst({
    where: { id: userId, businessId: session.business.id },
    select: { id: true, role: true },
  });
  if (!target) notFound("User");
  if (target.id === session.user.id) {
    throw new HttpError(
      409,
      "cannot_remove_self",
      "You cannot remove your own account",
    );
  }
  if (target.role === "OWNER") {
    throw new HttpError(403, "forbidden", "Owners cannot be removed");
  }
  await prisma.user.deleteMany({
    where: { id: target.id, businessId: session.business.id },
  });
}

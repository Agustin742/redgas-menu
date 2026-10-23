import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { HttpError } from "@/server/http";
import {
  createSessionToken,
  setSessionCookie,
  type Session,
} from "@/server/auth/session";

export const loginSchema = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(200),
});

// Verified against when the email is unknown so both failures cost the same.
const DUMMY_HASH = `scrypt$${"00".repeat(16)}$${"00".repeat(64)}`;

export async function login(
  input: z.infer<typeof loginSchema>,
): Promise<Session> {
  const user = await prisma.user.findFirst({
    where: { email: { equals: input.email, mode: "insensitive" } },
    include: { business: { select: { id: true, slug: true, name: true } } },
  });
  const valid = await verifyPassword(
    input.password,
    user?.passwordHash ?? DUMMY_HASH,
  );
  if (!user || !valid) {
    throw new HttpError(401, "invalid_credentials", "Invalid email or password");
  }

  await setSessionCookie(
    await createSessionToken({
      userId: user.id,
      businessId: user.businessId,
      role: user.role,
    }),
  );
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    business: user.business,
  };
}

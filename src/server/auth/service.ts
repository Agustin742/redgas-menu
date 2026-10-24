import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { HttpError } from "@/server/http";
import {
  assertLoginAllowed,
  clearFailedLogins,
  recordFailedLogin,
} from "@/server/auth/rate-limit";
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
  ip: string,
): Promise<Session> {
  const email = input.email.trim().toLowerCase();
  await assertLoginAllowed(email, ip);

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: { business: { select: { id: true, slug: true, name: true } } },
  });
  const valid = await verifyPassword(
    input.password,
    user?.passwordHash ?? DUMMY_HASH,
  );
  if (!user || !valid) {
    await recordFailedLogin(email, ip);
    throw new HttpError(401, "invalid_credentials", "Invalid email or password");
  }

  await clearFailedLogins(email, ip);
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

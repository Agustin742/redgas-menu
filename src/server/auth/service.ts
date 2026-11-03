import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { HttpError } from "@/server/http";
import {
  assertLoginAllowed,
  clearFailedLogins,
  recordFailedLogin,
} from "@/server/auth/rate-limit";
import {
  createSessionToken,
  passwordVersion,
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
      passwordVersion: passwordVersion(user.passwordHash),
    }),
  );
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    business: user.business,
  };
}

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(8).max(200),
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    path: ["newPassword"],
    message: "Must differ from the current password",
  });

/** Failed-attempt budget key; namespaced so it never collides with a login email. */
const changeKey = (userId: string) => `pw:${userId}`;

/**
 * Changes the signed-in user's password. Wrong current passwords count against
 * the shared login limiter (per user + IP, and per IP). On success every other
 * session is revoked and the current one is re-issued under the new password.
 */
export async function changePassword(
  session: Session,
  input: z.infer<typeof changePasswordSchema>,
  ip = "unknown",
) {
  const key = changeKey(session.user.id);
  await assertLoginAllowed(key, ip);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    await recordFailedLogin(key, ip);
    // 400, not 401: the session itself is still valid.
    throw new HttpError(400, "invalid_password", "Current password is incorrect");
  }
  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });
  await clearFailedLogins(key, ip);
  await setSessionCookie(
    await createSessionToken({
      userId: session.user.id,
      businessId: session.business.id,
      role: session.user.role,
      passwordVersion: passwordVersion(passwordHash),
    }),
  );
}

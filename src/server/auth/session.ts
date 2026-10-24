import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/enums";
import { HttpError } from "@/server/http";

export const SESSION_COOKIE = "session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

export type SessionClaims = {
  userId: string;
  businessId: string;
  role: UserRole;
};

export type Session = {
  user: { id: string; email: string; name: string; role: UserRole };
  business: { id: string; slug: string; name: string };
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters long");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(claims: SessionClaims) {
  return new SignJWT({ businessId: claims.businessId, role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionClaims | null> {
  const key = secretKey(); // misconfiguration must surface, not look like a bad token
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    const { sub, businessId, role } = payload;
    if (
      typeof sub !== "string" ||
      typeof businessId !== "string" ||
      (role !== "OWNER" && role !== "STAFF")
    ) {
      return null;
    }
    return { userId: sub, businessId, role };
  } catch {
    return null;
  }
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    ...cookieOptions,
    maxAge: SESSION_SECONDS,
  });
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

/** Returns the current session, or null when missing, invalid or revoked. */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const claims = await verifySessionToken(token);
  if (!claims) return null;

  // Re-check on every request so deleted users lose access immediately.
  // The database is the source of truth for tenant and role, not the token.
  const user = await prisma.user.findUnique({
    where: { id: claims.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      business: { select: { id: true, slug: true, name: true } },
    },
  });
  if (!user) return null;
  const { business, ...profile } = user;
  return { user: profile, business };
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new HttpError(401, "unauthorized", "Authentication required");
  }
  return session;
}

/** Like requireSession, but only the business OWNER passes. */
export async function requireOwner(): Promise<Session> {
  const session = await requireSession();
  if (session.user.role !== "OWNER") {
    throw new HttpError(403, "forbidden", "Owner role required");
  }
  return session;
}

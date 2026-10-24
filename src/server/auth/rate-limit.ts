import { prisma } from "@/lib/db";
import { HttpError } from "@/server/http";

const WINDOW_MS = 15 * 60 * 1000;
const RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_PER_EMAIL_IP = 5;
const MAX_PER_IP = 20;

/**
 * First `x-forwarded-for` entry (set by the hosting proxy), then `x-real-ip`.
 * Spoofable when the app is not behind a trusted proxy.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Throws 429 with Retry-After when the (email, ip) or ip failure budget is spent. */
export async function assertLoginAllowed(email: string, ip: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  const scopes = [
    { where: { email, ip, createdAt: { gte: since } }, max: MAX_PER_EMAIL_IP },
    { where: { ip, createdAt: { gte: since } }, max: MAX_PER_IP },
  ];
  let retryAfter = 0;
  for (const { where, max } of scopes) {
    const attempts = await prisma.loginAttempt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: max,
      select: { createdAt: true },
    });
    if (attempts.length < max) continue;
    // The window frees a slot when the oldest counted attempt expires.
    const expiresAt = attempts[max - 1].createdAt.getTime() + WINDOW_MS;
    retryAfter = Math.max(retryAfter, Math.ceil((expiresAt - Date.now()) / 1000));
  }
  if (retryAfter > 0) {
    throw new HttpError(
      429,
      "too_many_attempts",
      "Too many failed login attempts. Try again later.",
      undefined,
      { "Retry-After": String(Math.max(1, retryAfter)) },
    );
  }
}

export async function recordFailedLogin(email: string, ip: string) {
  await prisma.loginAttempt.create({ data: { email, ip } });
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } },
  });
}

export async function clearFailedLogins(email: string, ip: string) {
  await prisma.loginAttempt.deleteMany({ where: { email, ip } });
}

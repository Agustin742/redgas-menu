import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import {
  createSessionToken,
  getSession,
  passwordVersion,
  requireOwner,
} from "@/server/auth/session";
import { HttpError } from "@/server/http";

jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("@/lib/db", () => ({ prisma: { user: { findUnique: jest.fn() } } }));

const cookieGet = jest.fn();
const findUnique = prisma.user.findUnique as jest.Mock;

const HASH = "scrypt$aa$bb";

async function signInAs(role: "OWNER" | "STAFF", version = passwordVersion(HASH)) {
  const token = await createSessionToken({
    userId: "u1",
    businessId: "b1",
    role,
    passwordVersion: version,
  });
  cookieGet.mockReturnValue({ value: token });
  findUnique.mockResolvedValue({
    id: "u1",
    email: "a@b.co",
    name: "A",
    role,
    passwordHash: HASH,
    business: { id: "b1", slug: "s", name: "S" },
  });
}

beforeAll(() => {
  process.env.AUTH_SECRET = "x".repeat(32);
});
beforeEach(() => {
  jest.resetAllMocks();
  (cookies as jest.Mock).mockResolvedValue({ get: cookieGet });
});

describe("requireOwner", () => {
  test("rejects a request without a session cookie with 401", async () => {
    cookieGet.mockReturnValue(undefined);
    await expect(requireOwner()).rejects.toMatchObject({ status: 401, code: "unauthorized" });
  });

  test("rejects STAFF with 403 forbidden", async () => {
    await signInAs("STAFF");
    const error = await requireOwner().catch((e) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ status: 403, code: "forbidden" });
  });

  test("returns the session for an OWNER", async () => {
    await signInAs("OWNER");
    const session = await requireOwner();
    expect(session.user.role).toBe("OWNER");
    expect(session.business.id).toBe("b1");
  });
});

describe("getSession password binding", () => {
  test("accepts a token issued under the current password", async () => {
    await signInAs("OWNER");
    const session = await getSession();
    expect(session?.user.id).toBe("u1");
    expect(session?.user).not.toHaveProperty("passwordHash");
  });

  test("rejects a token issued before the password changed", async () => {
    await signInAs("OWNER", passwordVersion("scrypt$old$hash"));
    expect(await getSession()).toBeNull();
  });

  test("rejects a legacy token without a password version", async () => {
    const { SignJWT } = await import("jose");
    const token = await new SignJWT({ businessId: "b1", role: "OWNER" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("x".repeat(32)));
    cookieGet.mockReturnValue({ value: token });
    expect(await getSession()).toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });
});

import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { createSessionToken, requireOwner } from "@/server/auth/session";
import { HttpError } from "@/server/http";

jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("@/lib/db", () => ({ prisma: { user: { findUnique: jest.fn() } } }));

const cookieGet = jest.fn();
const findUnique = prisma.user.findUnique as jest.Mock;

async function signInAs(role: "OWNER" | "STAFF") {
  const token = await createSessionToken({ userId: "u1", businessId: "b1", role });
  cookieGet.mockReturnValue({ value: token });
  findUnique.mockResolvedValue({
    id: "u1",
    email: "a@b.co",
    name: "A",
    role,
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

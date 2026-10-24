import { prisma } from "@/lib/db";
import { assertLoginAllowed, getClientIp } from "@/server/auth/rate-limit";

jest.mock("@/lib/db", () => ({ prisma: { loginAttempt: { findMany: jest.fn() } } }));

const findMany = prisma.loginAttempt.findMany as jest.Mock;

const NOW = new Date("2026-01-01T12:00:00Z");
const WINDOW_SECONDS = 15 * 60;

beforeEach(() => {
  jest.resetAllMocks();
  jest.useFakeTimers({ now: NOW });
});
afterEach(() => jest.useRealTimers());

describe("assertLoginAllowed", () => {
  test("passes when under the budget", async () => {
    findMany.mockResolvedValue([{ createdAt: NOW }]);
    await expect(assertLoginAllowed("a@x.co", "1.1.1.1")).resolves.toBeUndefined();
  });

  test("429 with Retry-After from the oldest counted attempt at 5 per email+IP", async () => {
    // Newest first; the 5th (oldest) attempt happened 10 minutes ago.
    const attempts = [0, 60, 120, 180, 600].map((s) => ({
      createdAt: new Date(NOW.getTime() - s * 1000),
    }));
    findMany.mockImplementation(async ({ take }: { take: number }) => (take === 5 ? attempts : []));
    const error = await assertLoginAllowed("a@x.co", "1.1.1.1").catch((e) => e);
    expect(error).toMatchObject({ status: 429, code: "too_many_attempts" });
    expect(error.headers["Retry-After"]).toBe(String(WINDOW_SECONDS - 600));
  });
});

describe("getClientIp", () => {
  const req = (headers: Record<string, string>) => new Request("http://x.test", { headers });

  test("prefers the first x-forwarded-for entry", () => {
    expect(
      getClientIp(req({ "x-forwarded-for": "1.1.1.1, 2.2.2.2", "x-real-ip": "3.3.3.3" })),
    ).toBe("1.1.1.1");
  });

  test("falls back to x-real-ip, then unknown", () => {
    expect(getClientIp(req({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(getClientIp(req({}))).toBe("unknown");
  });
});

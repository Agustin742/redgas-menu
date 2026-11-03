import { prisma } from "@/lib/db";
import { changePassword } from "@/server/auth/service";
import { hashPassword, verifyPassword } from "@/lib/password";
import { assertLoginAllowed, clearFailedLogins, recordFailedLogin } from "@/server/auth/rate-limit";
import { HttpError } from "@/server/http";
import { passwordVersion, setSessionCookie, type Session } from "@/server/auth/session";
import { jwtVerify } from "jose";

jest.mock("@/lib/db", () => ({
  prisma: { user: { findUniqueOrThrow: jest.fn(), update: jest.fn() } },
}));
// service.ts imports the session module, which pulls in next/headers.
jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("@/server/auth/rate-limit", () => ({
  assertLoginAllowed: jest.fn(),
  recordFailedLogin: jest.fn(),
  clearFailedLogins: jest.fn(),
}));
jest.mock("@/server/auth/session", () => ({
  ...jest.requireActual("@/server/auth/session"),
  setSessionCookie: jest.fn(),
}));

const user = prisma.user as unknown as Record<"findUniqueOrThrow" | "update", jest.Mock>;

const session: Session = {
  user: { id: "u1", email: "s@x.co", name: "Staff", role: "STAFF" },
  business: { id: "biz-1", slug: "red-gas", name: "Red Gas" },
};

beforeAll(() => {
  process.env.AUTH_SECRET = "x".repeat(32);
});
beforeEach(() => jest.resetAllMocks());

describe("changePassword", () => {
  test("400 invalid_password, failure recorded and no update when the current password is wrong", async () => {
    user.findUniqueOrThrow.mockResolvedValue({ passwordHash: await hashPassword("current-pass") });
    await expect(
      changePassword(session, { currentPassword: "wrong-pass", newPassword: "new-password" }, "1.1.1.1"),
    ).rejects.toMatchObject({ status: 400, code: "invalid_password" });
    expect(user.update).not.toHaveBeenCalled();
    expect(recordFailedLogin).toHaveBeenCalledWith("pw:u1", "1.1.1.1");
    expect(setSessionCookie).not.toHaveBeenCalled();
  });

  test("429 before touching the database when the limiter blocks", async () => {
    (assertLoginAllowed as jest.Mock).mockRejectedValue(
      new HttpError(429, "too_many_attempts", "Too many"),
    );
    await expect(
      changePassword(session, { currentPassword: "current-pass", newPassword: "new-password" }, "1.1.1.1"),
    ).rejects.toMatchObject({ status: 429, code: "too_many_attempts" });
    expect(assertLoginAllowed).toHaveBeenCalledWith("pw:u1", "1.1.1.1");
    expect(user.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  test("stores a hash that verifies against the new password and clears failures", async () => {
    user.findUniqueOrThrow.mockResolvedValue({ passwordHash: await hashPassword("current-pass") });
    await changePassword(session, { currentPassword: "current-pass", newPassword: "new-password" }, "1.1.1.1");
    const { where, data } = user.update.mock.calls[0][0];
    expect(where).toEqual({ id: "u1" });
    expect(await verifyPassword("new-password", data.passwordHash)).toBe(true);
    expect(await verifyPassword("current-pass", data.passwordHash)).toBe(false);
    expect(clearFailedLogins).toHaveBeenCalledWith("pw:u1", "1.1.1.1");
  });

  test("re-issues the current session bound to the new password", async () => {
    user.findUniqueOrThrow.mockResolvedValue({ passwordHash: await hashPassword("current-pass") });
    await changePassword(session, { currentPassword: "current-pass", newPassword: "new-password" }, "1.1.1.1");
    const { data } = user.update.mock.calls[0][0];
    const token = (setSessionCookie as jest.Mock).mock.calls[0][0] as string;
    const { payload } = await jwtVerify(token, new TextEncoder().encode("x".repeat(32)));
    expect(payload).toMatchObject({
      sub: "u1",
      businessId: "biz-1",
      role: "STAFF",
      pv: passwordVersion(data.passwordHash),
    });
  });
});

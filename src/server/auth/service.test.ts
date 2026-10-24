import { prisma } from "@/lib/db";
import { changePassword } from "@/server/auth/service";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { Session } from "@/server/auth/session";

jest.mock("@/lib/db", () => ({
  prisma: { user: { findUniqueOrThrow: jest.fn(), update: jest.fn() } },
}));
// service.ts imports the session module, which pulls in next/headers.
jest.mock("next/headers", () => ({ cookies: jest.fn() }));

const user = prisma.user as unknown as Record<"findUniqueOrThrow" | "update", jest.Mock>;

const session: Session = {
  user: { id: "u1", email: "s@x.co", name: "Staff", role: "STAFF" },
  business: { id: "biz-1", slug: "red-gas", name: "Red Gas" },
};

beforeEach(() => jest.resetAllMocks());

describe("changePassword", () => {
  test("400 invalid_password and no update when the current password is wrong", async () => {
    user.findUniqueOrThrow.mockResolvedValue({ passwordHash: await hashPassword("current-pass") });
    await expect(
      changePassword(session, { currentPassword: "wrong-pass", newPassword: "new-password" }),
    ).rejects.toMatchObject({ status: 400, code: "invalid_password" });
    expect(user.update).not.toHaveBeenCalled();
  });

  test("stores a hash that verifies against the new password", async () => {
    user.findUniqueOrThrow.mockResolvedValue({ passwordHash: await hashPassword("current-pass") });
    await changePassword(session, { currentPassword: "current-pass", newPassword: "new-password" });
    const { where, data } = user.update.mock.calls[0][0];
    expect(where).toEqual({ id: "u1" });
    expect(await verifyPassword("new-password", data.passwordHash)).toBe(true);
    expect(await verifyPassword("current-pass", data.passwordHash)).toBe(false);
  });
});

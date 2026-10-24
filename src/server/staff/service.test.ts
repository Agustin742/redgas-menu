import { prisma } from "@/lib/db";
import { createStaff, removeStaff } from "@/server/staff/service";
import type { Session } from "@/server/auth/session";

jest.mock("@/lib/db", () => ({
  prisma: { user: { findFirst: jest.fn(), create: jest.fn(), deleteMany: jest.fn() } },
}));

const user = prisma.user as unknown as Record<"findFirst" | "create" | "deleteMany", jest.Mock>;

const session: Session = {
  user: { id: "owner-1", email: "o@x.co", name: "Owner", role: "OWNER" },
  business: { id: "biz-1", slug: "red-gas", name: "Red Gas" },
};

beforeEach(() => jest.resetAllMocks());

describe("removeStaff", () => {
  test("404 when the user is unknown or belongs to another business", async () => {
    user.findFirst.mockResolvedValue(null);
    await expect(removeStaff(session, "foreign")).rejects.toMatchObject({ status: 404 });
    expect(user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "foreign", businessId: "biz-1" } }),
    );
    expect(user.deleteMany).not.toHaveBeenCalled();
  });

  test("409 cannot_remove_self", async () => {
    user.findFirst.mockResolvedValue({ id: "owner-1", role: "OWNER" });
    await expect(removeStaff(session, "owner-1")).rejects.toMatchObject({
      status: 409,
      code: "cannot_remove_self",
    });
    expect(user.deleteMany).not.toHaveBeenCalled();
  });

  test("403 when removing another OWNER", async () => {
    user.findFirst.mockResolvedValue({ id: "owner-2", role: "OWNER" });
    await expect(removeStaff(session, "owner-2")).rejects.toMatchObject({ status: 403 });
    expect(user.deleteMany).not.toHaveBeenCalled();
  });

  test("deletes STAFF scoped by business", async () => {
    user.findFirst.mockResolvedValue({ id: "staff-1", role: "STAFF" });
    await removeStaff(session, "staff-1");
    expect(user.deleteMany).toHaveBeenCalledWith({
      where: { id: "staff-1", businessId: "biz-1" },
    });
  });
});

describe("createStaff", () => {
  const input = { email: "new@x.co", name: "New", password: "password-1" };

  test("409 when the email exists, matched case-insensitively", async () => {
    user.findFirst.mockResolvedValue({ id: "other" });
    await expect(createStaff("biz-1", input)).rejects.toMatchObject({ status: 409 });
    expect(user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: { equals: input.email, mode: "insensitive" } },
      }),
    );
    expect(user.create).not.toHaveBeenCalled();
  });

  test("creates a STAFF user and never selects passwordHash", async () => {
    user.findFirst.mockResolvedValue(null);
    user.create.mockResolvedValue({ id: "s1" });
    await createStaff("biz-1", input);
    const args = user.create.mock.calls[0][0];
    expect(args.data).toMatchObject({ businessId: "biz-1", role: "STAFF" });
    expect(args.data.passwordHash).not.toBe(input.password);
    expect(args.select).not.toHaveProperty("passwordHash");
  });
});

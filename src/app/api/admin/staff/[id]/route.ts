import { requireOwner } from "@/server/auth/session";
import { handle, noContent } from "@/server/http";
import { removeStaff } from "@/server/staff/service";

type Context = { params: Promise<{ id: string }> };

export const DELETE = handle(async (_request, { params }: Context) => {
  const session = await requireOwner();
  const { id } = await params;
  await removeStaff(session, id);
  return noContent();
});

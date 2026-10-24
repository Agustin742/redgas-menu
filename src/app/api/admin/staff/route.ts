import { requireOwner } from "@/server/auth/session";
import { handle, json, parseJson } from "@/server/http";
import {
  createStaff,
  createStaffSchema,
  listStaff,
} from "@/server/staff/service";

export const GET = handle(async () => {
  const { business } = await requireOwner();
  return json(await listStaff(business.id));
});

export const POST = handle(async (request) => {
  const { business } = await requireOwner();
  const input = await parseJson(request, createStaffSchema);
  return json(await createStaff(business.id, input), { status: 201 });
});

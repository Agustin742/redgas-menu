import { requireSession } from "@/server/auth/session";
import { handle, json } from "@/server/http";

export const GET = handle(async () => json(await requireSession()));

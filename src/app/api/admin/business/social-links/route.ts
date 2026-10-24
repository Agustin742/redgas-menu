import { requireOwner } from "@/server/auth/session";
import {
  listSocialLinks,
  replaceSocialLinks,
  socialLinksSchema,
} from "@/server/business/service";
import { handle, json, parseJson, revalidateMenu } from "@/server/http";

export const GET = handle(async () => {
  const { business } = await requireOwner();
  return json({ links: await listSocialLinks(business.id) });
});

export const PUT = handle(async (request) => {
  const { business } = await requireOwner();
  const input = await parseJson(request, socialLinksSchema);
  const links = await replaceSocialLinks(business.id, input);
  revalidateMenu(business.slug);
  return json({ links });
});

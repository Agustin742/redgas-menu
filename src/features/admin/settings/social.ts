import { socialLabel, type SocialPlatformName } from "@/server/public-menu/mapper";

export const SOCIAL_PLATFORMS: SocialPlatformName[] = [
  "INSTAGRAM",
  "WHATSAPP",
  "FACEBOOK",
  "TIKTOK",
  "X",
  "WEBSITE",
];

export const MAX_SOCIAL_LINKS = 10;

export type SocialDraft = {
  key: string;
  platform: SocialPlatformName;
  handle: string;
  url: string;
};

export const platformOptions = SOCIAL_PLATFORMS.map((platform) => ({
  value: platform,
  label: socialLabel(platform),
}));

const AT_PLATFORMS: SocialPlatformName[] = ["INSTAGRAM", "TIKTOK", "X"];

/** Trims the handle and adds the leading "@" where the platform uses it. */
export function normalizeHandle(platform: SocialPlatformName, value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed === "" || !AT_PLATFORMS.includes(platform)) return trimmed;
  const bare = trimmed.replace(/^@+/, "").replace(/\s/g, "");
  return bare === "" ? "" : `@${bare}`;
}

/** Returns an http(s) URL, null when empty, or undefined when it is not a valid link. */
export function normalizeUrl(value: string): string | null | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? candidate : undefined;
  } catch {
    return undefined;
  }
}

/** Errors keyed by draft key, then by field ("handle" | "url" | "platform"), in Spanish. */
export function validateSocial(drafts: SocialDraft[]): Record<string, Record<string, string>> {
  const errors: Record<string, Record<string, string>> = {};
  const seen = new Set<SocialPlatformName>();
  for (const draft of drafts) {
    const own: Record<string, string> = {};
    const handle = normalizeHandle(draft.platform, draft.handle);
    if (handle === "") {
      own.handle = "Escribí el usuario o dato que se muestra.";
    } else if (handle.length > 100) {
      own.handle = "Puede tener hasta 100 caracteres.";
    }
    if (normalizeUrl(draft.url) === undefined) {
      own.url = "Revisá el enlace: tiene que ser una dirección web válida.";
    }
    if (seen.has(draft.platform)) {
      own.platform = `Ya agregaste ${socialLabel(draft.platform)}.`;
    }
    seen.add(draft.platform);
    if (Object.keys(own).length > 0) errors[draft.key] = own;
  }
  return errors;
}

/** Body of PUT /api/admin/business/social-links; position comes from array order. */
export function toSocialPayload(drafts: SocialDraft[]) {
  return {
    links: drafts.map((draft) => {
      const url = normalizeUrl(draft.url);
      return {
        platform: draft.platform,
        handle: normalizeHandle(draft.platform, draft.handle),
        ...(url ? { url } : {}),
      };
    }),
  };
}

/** First platform not used yet, to prefill "add network". */
export function nextPlatform(drafts: SocialDraft[]): SocialPlatformName {
  const used = new Set(drafts.map((draft) => draft.platform));
  return SOCIAL_PLATFORMS.find((platform) => !used.has(platform)) ?? SOCIAL_PLATFORMS[0];
}

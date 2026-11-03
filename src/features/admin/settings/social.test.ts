import {
  nextPlatform,
  normalizeHandle,
  normalizeUrl,
  toSocialPayload,
  validateSocial,
  type SocialDraft,
} from "./social";

const draft = (over: Partial<SocialDraft> = {}): SocialDraft => ({
  key: "a",
  platform: "INSTAGRAM",
  handle: "redgas",
  url: "",
  ...over,
});

describe("normalizeHandle", () => {
  it("adds one @ for Instagram, TikTok and X only", () => {
    expect(normalizeHandle("INSTAGRAM", "  redgas.salta ")).toBe("@redgas.salta");
    expect(normalizeHandle("X", "@@redgas")).toBe("@redgas");
    expect(normalizeHandle("WHATSAPP", " +54 387 555 1234 ")).toBe("+54 387 555 1234");
    expect(normalizeHandle("INSTAGRAM", "   ")).toBe("");
    expect(normalizeHandle("INSTAGRAM", "@")).toBe("");
  });
});

describe("normalizeUrl", () => {
  it("returns null for empty, prefixes https and rejects non-web links", () => {
    expect(normalizeUrl("  ")).toBeNull();
    expect(normalizeUrl("instagram.com/redgas")).toBe("https://instagram.com/redgas");
    expect(normalizeUrl("http://redgas.com")).toBe("http://redgas.com");
    expect(normalizeUrl("javascript://x")).toBeUndefined();
    expect(normalizeUrl("no es un link")).toBeUndefined();
  });
});

describe("validateSocial / toSocialPayload", () => {
  it("flags empty handles, bad urls and duplicated platforms", () => {
    const errors = validateSocial([
      draft({ key: "1", handle: "" }),
      draft({ key: "2", platform: "FACEBOOK", url: "nope nope" }),
      draft({ key: "3", platform: "TIKTOK" }),
      draft({ key: "4" }),
    ]);
    expect(errors["1"].handle).toBeDefined();
    expect(errors["2"].url).toBeDefined();
    expect(errors["3"]).toBeUndefined();
    expect(errors["4"].platform).toMatch(/Instagram/);
  });

  it("omits empty urls from the payload and keeps order", () => {
    expect(
      toSocialPayload([
        draft({ url: "instagram.com/redgas" }),
        draft({ platform: "WEBSITE", handle: "redgas.com" }),
      ]),
    ).toEqual({
      links: [
        { platform: "INSTAGRAM", handle: "@redgas", url: "https://instagram.com/redgas" },
        { platform: "WEBSITE", handle: "redgas.com" },
      ],
    });
  });

  it("suggests the first unused platform", () => {
    expect(nextPlatform([draft()])).toBe("WHATSAPP");
  });
});

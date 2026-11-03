type HeaderReader = { get(name: string): string | null };

function firstValue(value: string | null): string | null {
  const first = value?.split(",")[0]?.trim();
  return first ? first : null;
}

function isLocalHost(host: string): boolean {
  const hostname = host.replace(/:\d+$/, "").toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function buildMenuUrl(headers: HeaderReader, slug: string): string {
  const host =
    firstValue(headers.get("x-forwarded-host")) ?? firstValue(headers.get("host")) ?? "localhost";
  const forwardedProto = firstValue(headers.get("x-forwarded-proto"));
  const proto = forwardedProto ?? (isLocalHost(host) ? "http" : "https");
  return `${proto}://${host}/c/${slug}`;
}

export function qrFileName(slug: string, extension: "png" | "svg"): string {
  const safe = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${safe || "carta"}-qr.${extension}`;
}

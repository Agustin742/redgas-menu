/** Largest font size (<= maxSize, >= minSize) whose measured width fits maxWidth. */
export function fitFontSize(
  measure: (fontSize: number) => number,
  maxWidth: number,
  maxSize: number,
  minSize: number,
): number {
  let size = maxSize;
  while (size > minSize && measure(size) > maxWidth) {
    size -= 2;
  }
  return Math.max(size, minSize);
}

/** URL without protocol and trailing slash, for small printed text. */
export function shortUrl(url: string): string {
  return url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").replace(/\/+$/, "");
}

export function qrCardFileName(slug: string): string {
  const safe = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${safe || "carta"}-qr-tarjeta.png`;
}

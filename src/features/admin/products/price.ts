/** Largest price accepted by the API, in cents. */
export const MAX_PRICE_CENTS = 100_000_000;

/**
 * Parses an Argentine-style price ("2800", "2.800", "2800,50", "$ 2.800,5")
 * into cents. Returns null when the text is not a valid price.
 * Works on digit strings so no floating-point rounding is involved.
 */
export function parsePriceInput(text: string): number | null {
  const cleaned = text.replace(/[$\s]/g, "");
  if (cleaned === "") return null;

  let whole: string;
  let fraction = "";

  if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    if (parts.length !== 2) return null;
    const [integerPart, decimalPart] = parts;
    if (!/^\d{1,3}(\.\d{3})+$|^\d+$/.test(integerPart)) return null;
    whole = integerPart.replace(/\./g, "");
    fraction = decimalPart;
  } else if (cleaned.includes(".")) {
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      whole = cleaned.replace(/\./g, "");
    } else if (/^\d+\.\d{1,2}$/.test(cleaned)) {
      [whole, fraction] = cleaned.split(".");
    } else {
      return null;
    }
  } else {
    whole = cleaned;
  }

  if (!/^\d+$/.test(whole) || !/^\d{0,2}$/.test(fraction)) return null;
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents <= MAX_PRICE_CENTS ? cents : null;
}

function group(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Formats cents as "$ 2.800", adding decimals only when cents are not zero. */
export function formatPrice(cents: number): string {
  const whole = Math.floor(cents / 100);
  const rest = cents % 100;
  const base = `$ ${group(String(whole))}`;
  return rest === 0 ? base : `${base},${String(rest).padStart(2, "0")}`;
}

/** Plain editable text for an input: "2800" or "2800,50". */
export function priceToInput(cents: number): string {
  const whole = Math.floor(cents / 100);
  const rest = cents % 100;
  return rest === 0 ? String(whole) : `${whole},${String(rest).padStart(2, "0")}`;
}

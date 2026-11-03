export type PromotionStatus = "active" | "scheduled" | "expired" | "paused";

export const STATUS_LABELS: Record<PromotionStatus, string> = {
  active: "Activa",
  scheduled: "Programada",
  expired: "Vencida",
  paused: "Pausada",
};

type Schedule = {
  isActive: boolean;
  startsAt: string | Date | null;
  endsAt: string | Date | null;
};

const toDate = (value: string | Date | null) =>
  value === null ? null : value instanceof Date ? value : new Date(value);

/**
 * Same window the public menu uses: [startsAt, endsAt], null = open.
 * A paused promotion stays "paused" even if its dates have passed.
 */
export function promotionStatus(promotion: Schedule, now: Date = new Date()): PromotionStatus {
  if (!promotion.isActive) return "paused";
  const startsAt = toDate(promotion.startsAt);
  const endsAt = toDate(promotion.endsAt);
  if (startsAt && startsAt > now) return "scheduled";
  if (endsAt && endsAt < now) return "expired";
  return "active";
}

const pad = (value: number) => String(value).padStart(2, "0");

/** ISO-8601 with the Date's local UTC offset, e.g. 2026-11-03T00:00:00-03:00. */
export function toIsoWithOffset(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

function parseDay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return valid ? { year, month, day } : null;
}

/**
 * Converts a date input value (YYYY-MM-DD) to an ISO string in the browser's
 * time zone: start of day (00:00:00) or end of day (23:59:59).
 * Returns null for an empty or invalid value.
 */
export function dayToIso(value: string, edge: "start" | "end"): string | null {
  const day = parseDay(value);
  if (!day) return null;
  const date =
    edge === "start"
      ? new Date(day.year, day.month - 1, day.day, 0, 0, 0)
      : new Date(day.year, day.month - 1, day.day, 23, 59, 59);
  return toIsoWithOffset(date);
}

/** Local calendar day (YYYY-MM-DD) of an ISO instant, for a date input. */
export function isoToDay(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** True when both days are set and the end day comes before the start day. */
export function endsBeforeStart(startDay: string, endDay: string): boolean {
  return startDay !== "" && endDay !== "" && endDay < startDay;
}

function formatDay(iso: string, now: Date) {
  const date = new Date(iso);
  const sameYear = date.getFullYear() === now.getFullYear();
  const text = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
  return text.replace(/\./g, "");
}

/** Human text for the visibility window, e.g. "Del 3 nov al 10 nov". */
export function formatWindow(
  startsAt: string | null,
  endsAt: string | null,
  now: Date = new Date(),
): string {
  if (startsAt && endsAt) return `Del ${formatDay(startsAt, now)} al ${formatDay(endsAt, now)}`;
  if (startsAt) return `Desde el ${formatDay(startsAt, now)} · sin fecha de fin`;
  if (endsAt) return `Hasta el ${formatDay(endsAt, now)}`;
  return "Sin fecha de fin";
}

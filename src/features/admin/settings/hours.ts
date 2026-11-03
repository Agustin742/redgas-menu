import type { OpeningHoursRow } from "@/server/public-menu/mapper";

export type TimeRange = { opensAt: string; closesAt: string };

/** One day of the week; no ranges means the business is closed that day. */
export type DaySchedule = { dayOfWeek: number; ranges: TimeRange[] };

// Monday-first display order; dayOfWeek uses 0 = Sunday (same as the public formatter).
export const WEEK_DAYS = [
  { dayOfWeek: 1, label: "Lunes" },
  { dayOfWeek: 2, label: "Martes" },
  { dayOfWeek: 3, label: "Miércoles" },
  { dayOfWeek: 4, label: "Jueves" },
  { dayOfWeek: 5, label: "Viernes" },
  { dayOfWeek: 6, label: "Sábado" },
  { dayOfWeek: 0, label: "Domingo" },
] as const;

export const MAX_RANGES_PER_DAY = 3;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

/** Builds the Monday-first week from API rows, sorting each day's ranges. */
export function rowsToWeek(rows: OpeningHoursRow[]): DaySchedule[] {
  return WEEK_DAYS.map(({ dayOfWeek }) => ({
    dayOfWeek,
    ranges: rows
      .filter((row) => row.dayOfWeek === dayOfWeek)
      .map(({ opensAt, closesAt }) => ({ opensAt, closesAt }))
      .sort((a, b) => a.opensAt.localeCompare(b.opensAt)),
  }));
}

/** Flattens the week into the rows expected by PUT /api/admin/business/opening-hours. */
export function weekToRows(week: DaySchedule[]): OpeningHoursRow[] {
  return week.flatMap((day) =>
    day.ranges.map((range) => ({ dayOfWeek: day.dayOfWeek, ...range })),
  );
}

/** First problem per day (keyed by dayOfWeek), in Spanish; empty when the week is valid. */
export function validateWeek(week: DaySchedule[]): Record<number, string> {
  const errors: Record<number, string> = {};
  for (const day of week) {
    const ranges = day.ranges;
    if (ranges.some((r) => !isValidTime(r.opensAt) || !isValidTime(r.closesAt))) {
      errors[day.dayOfWeek] = "Completá la hora de apertura y de cierre.";
      continue;
    }
    if (ranges.some((r) => r.closesAt <= r.opensAt)) {
      errors[day.dayOfWeek] = "El cierre tiene que ser después de la apertura.";
      continue;
    }
    const sorted = [...ranges].sort((a, b) => a.opensAt.localeCompare(b.opensAt));
    if (sorted.some((r, i) => i > 0 && r.opensAt < sorted[i - 1].closesAt)) {
      errors[day.dayOfWeek] = "Los horarios del mismo día no pueden superponerse.";
    }
  }
  return errors;
}

/** Suggested range for "add another": starts where the last one ends. */
export function nextRange(ranges: TimeRange[]): TimeRange {
  const last = ranges[ranges.length - 1];
  if (!last || !isValidTime(last.closesAt)) return { opensAt: "09:00", closesAt: "18:00" };
  const [hours, minutes] = last.closesAt.split(":").map(Number);
  const closeHour = Math.min(hours + 3, 23);
  const closes =
    closeHour === hours
      ? "23:59"
      : `${String(closeHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return { opensAt: last.closesAt, closesAt: closes };
}

/** Copies one day's ranges to every day of the week. */
export function copyDayToAll(week: DaySchedule[], fromDay: number): DaySchedule[] {
  const source = week.find((day) => day.dayOfWeek === fromDay);
  if (!source) return week;
  return week.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    ranges: source.ranges.map((range) => ({ ...range })),
  }));
}

export function sameWeek(a: DaySchedule[], b: DaySchedule[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

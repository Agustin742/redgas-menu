import {
  copyDayToAll,
  isValidTime,
  nextRange,
  rowsToWeek,
  validateWeek,
  weekToRows,
  type DaySchedule,
} from "./hours";

const week = (overrides: Partial<Record<number, DaySchedule["ranges"]>> = {}): DaySchedule[] =>
  [1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => ({ dayOfWeek, ranges: overrides[dayOfWeek] ?? [] }));

describe("rowsToWeek / weekToRows", () => {
  it("orders days Monday to Sunday (0 = Sunday last) and sorts ranges", () => {
    const result = rowsToWeek([
      { dayOfWeek: 0, opensAt: "09:00", closesAt: "13:00" },
      { dayOfWeek: 1, opensAt: "17:00", closesAt: "20:00" },
      { dayOfWeek: 1, opensAt: "08:00", closesAt: "12:00" },
    ]);
    expect(result.map((d) => d.dayOfWeek)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(result[0].ranges.map((r) => r.opensAt)).toEqual(["08:00", "17:00"]);
    expect(result[6].ranges).toHaveLength(1);
  });

  it("round-trips through API rows and skips closed days", () => {
    const rows = [
      { dayOfWeek: 1, opensAt: "08:00", closesAt: "12:00" },
      { dayOfWeek: 1, opensAt: "17:00", closesAt: "20:00" },
      { dayOfWeek: 6, opensAt: "09:00", closesAt: "13:00" },
    ];
    expect(weekToRows(rowsToWeek(rows))).toEqual(rows);
  });
});

describe("validateWeek", () => {
  it("accepts closed days and valid split shifts", () => {
    const ok = week({
      1: [
        { opensAt: "08:00", closesAt: "12:00" },
        { opensAt: "12:00", closesAt: "20:00" },
      ],
    });
    expect(validateWeek(ok)).toEqual({});
  });

  it("flags empty times, inverted ranges and overlaps per day", () => {
    const errors = validateWeek(
      week({
        1: [{ opensAt: "", closesAt: "12:00" }],
        2: [{ opensAt: "12:00", closesAt: "12:00" }],
        3: [
          { opensAt: "08:00", closesAt: "13:00" },
          { opensAt: "12:00", closesAt: "18:00" },
        ],
      }),
    );
    expect(errors[1]).toMatch(/Completá/);
    expect(errors[2]).toMatch(/después de la apertura/);
    expect(errors[3]).toMatch(/superponer/);
    expect(errors[4]).toBeUndefined();
  });
});

describe("helpers", () => {
  it("validates HH:mm", () => {
    expect(isValidTime("08:30")).toBe(true);
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("8:30")).toBe(false);
  });

  it("copies Monday to every day without sharing references", () => {
    const copied = copyDayToAll(week({ 1: [{ opensAt: "08:00", closesAt: "20:00" }] }), 1);
    expect(copied.every((d) => d.ranges[0]?.closesAt === "20:00")).toBe(true);
    expect(copied[0].ranges[0]).not.toBe(copied[1].ranges[0]);
  });

  it("suggests the next range after the last one", () => {
    expect(nextRange([])).toEqual({ opensAt: "09:00", closesAt: "18:00" });
    expect(nextRange([{ opensAt: "08:00", closesAt: "12:00" }])).toEqual({
      opensAt: "12:00",
      closesAt: "15:00",
    });
    expect(nextRange([{ opensAt: "08:00", closesAt: "23:00" }]).closesAt).toBe("23:59");
  });
});

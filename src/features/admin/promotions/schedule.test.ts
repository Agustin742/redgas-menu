import {
  dayToIso,
  endsBeforeStart,
  formatWindow,
  isoToDay,
  promotionStatus,
  toIsoWithOffset,
} from "./schedule";

const now = new Date("2026-11-10T15:00:00Z");

describe("promotionStatus", () => {
  it("is paused whenever isActive is false", () => {
    expect(promotionStatus({ isActive: false, startsAt: null, endsAt: null }, now)).toBe("paused");
    expect(
      promotionStatus({ isActive: false, startsAt: null, endsAt: "2026-01-01T00:00:00Z" }, now),
    ).toBe("paused");
  });

  it("is active without dates and inside the window", () => {
    expect(promotionStatus({ isActive: true, startsAt: null, endsAt: null }, now)).toBe("active");
    expect(
      promotionStatus(
        { isActive: true, startsAt: "2026-11-01T00:00:00Z", endsAt: "2026-11-20T00:00:00Z" },
        now,
      ),
    ).toBe("active");
  });

  it("is scheduled before it starts and expired after it ends", () => {
    expect(
      promotionStatus({ isActive: true, startsAt: "2026-11-11T00:00:00Z", endsAt: null }, now),
    ).toBe("scheduled");
    expect(
      promotionStatus({ isActive: true, startsAt: null, endsAt: "2026-11-09T00:00:00Z" }, now),
    ).toBe("expired");
  });

  it("accepts Date objects", () => {
    expect(
      promotionStatus({ isActive: true, startsAt: new Date("2026-12-01T00:00:00Z"), endsAt: null }, now),
    ).toBe("scheduled");
  });
});

describe("day conversion", () => {
  it("produces ISO strings with an explicit offset", () => {
    expect(dayToIso("2026-11-03", "start")).toMatch(/^2026-11-03T00:00:00[+-]\d{2}:\d{2}$/);
    expect(dayToIso("2026-11-03", "end")).toMatch(/^2026-11-03T23:59:59[+-]\d{2}:\d{2}$/);
  });

  it("represents the local instant", () => {
    const iso = dayToIso("2026-11-03", "start")!;
    expect(new Date(iso).getTime()).toBe(new Date(2026, 10, 3, 0, 0, 0).getTime());
  });

  it("round-trips days through ISO", () => {
    expect(isoToDay(dayToIso("2026-02-28", "end"))).toBe("2026-02-28");
    expect(isoToDay(dayToIso("2026-12-31", "start"))).toBe("2026-12-31");
  });

  it("rejects empty and impossible days", () => {
    expect(dayToIso("", "start")).toBeNull();
    expect(dayToIso("2026-02-30", "start")).toBeNull();
    expect(dayToIso("nope", "end")).toBeNull();
    expect(isoToDay(null)).toBe("");
    expect(isoToDay("garbage")).toBe("");
  });

  it("formats offsets for positive and negative zones", () => {
    expect(toIsoWithOffset(new Date(2026, 0, 1, 8, 5, 9))).toMatch(
      /^2026-01-01T08:05:09[+-]\d{2}:\d{2}$/,
    );
  });
});

describe("endsBeforeStart", () => {
  it("only flags a complete reversed range", () => {
    expect(endsBeforeStart("2026-11-10", "2026-11-09")).toBe(true);
    expect(endsBeforeStart("2026-11-10", "2026-11-10")).toBe(false);
    expect(endsBeforeStart("", "2026-11-09")).toBe(false);
    expect(endsBeforeStart("2026-11-10", "")).toBe(false);
  });
});

describe("formatWindow", () => {
  const start = dayToIso("2026-11-03", "start");
  const end = dayToIso("2026-11-10", "end");

  it("describes closed, half-open and open windows", () => {
    expect(formatWindow(start, end, now)).toMatch(/^Del 3 nov\w* al 10 nov\w*$/);
    expect(formatWindow(start, null, now)).toMatch(/^Desde el 3 nov\w* · sin fecha de fin$/);
    expect(formatWindow(null, end, now)).toMatch(/^Hasta el 10 nov\w*$/);
    expect(formatWindow(null, null, now)).toBe("Sin fecha de fin");
  });

  it("adds the year when it is not the current one", () => {
    expect(formatWindow(null, dayToIso("2027-01-05", "end"), now)).toMatch(/2027/);
  });
});

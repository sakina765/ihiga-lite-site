import { resolveSeasonFromBoundaries } from "./season-resolution.util";
import { DEFAULT_SEASON_BOUNDARIES } from "./season.constants";

// Local-time Date construction throughout, to stay consistent with
// resolveSeasonFromBoundaries (which reads getMonth()/getDate() in local time).
function d(year: number, month1Indexed: number, day: number): Date {
  return new Date(year, month1Indexed - 1, day);
}

describe("resolveSeasonFromBoundaries", () => {
  describe("mid-season dates", () => {
    it("resolves a date in the middle of Season A (Urugaryi)", () => {
      const result = resolveSeasonFromBoundaries(d(2026, 11, 1), DEFAULT_SEASON_BOUNDARIES);
      expect(result.code).toBe("A");
      expect(result.localName).toBe("Urugaryi");
    });

    it("resolves a date in the middle of Season B (Itumba)", () => {
      const result = resolveSeasonFromBoundaries(d(2026, 4, 1), DEFAULT_SEASON_BOUNDARIES);
      expect(result.code).toBe("B");
      expect(result.localName).toBe("Itumba");
    });

    it("resolves a date in the middle of Season C (Impeshyi)", () => {
      const result = resolveSeasonFromBoundaries(d(2026, 8, 1), DEFAULT_SEASON_BOUNDARIES);
      expect(result.code).toBe("C");
      expect(result.localName).toBe("Impeshyi");
    });
  });

  describe("boundary edge dates", () => {
    it("Feb 14 is the last day of Season A", () => {
      expect(resolveSeasonFromBoundaries(d(2026, 2, 14), DEFAULT_SEASON_BOUNDARIES).code).toBe("A");
    });

    it("Feb 15 is the first day of Season B", () => {
      expect(resolveSeasonFromBoundaries(d(2026, 2, 15), DEFAULT_SEASON_BOUNDARIES).code).toBe("B");
    });

    it("Jun 15 is the last day of Season B", () => {
      expect(resolveSeasonFromBoundaries(d(2026, 6, 15), DEFAULT_SEASON_BOUNDARIES).code).toBe("B");
    });

    it("Jun 16 is the first day of Season C", () => {
      expect(resolveSeasonFromBoundaries(d(2026, 6, 16), DEFAULT_SEASON_BOUNDARIES).code).toBe("C");
    });

    it("Sept 14 is the last day of Season C", () => {
      expect(resolveSeasonFromBoundaries(d(2026, 9, 14), DEFAULT_SEASON_BOUNDARIES).code).toBe("C");
    });

    it("Sept 15 is the first day of Season A", () => {
      expect(resolveSeasonFromBoundaries(d(2026, 9, 15), DEFAULT_SEASON_BOUNDARIES).code).toBe("A");
    });
  });

  describe("year-wraparound of Season A", () => {
    it("computes correct start/end when the date is in the early part of the year (Jan)", () => {
      const result = resolveSeasonFromBoundaries(d(2026, 1, 10), DEFAULT_SEASON_BOUNDARIES);
      expect(result.code).toBe("A");
      expect(result.startDate).toEqual(d(2025, 9, 15));
      expect(result.endDate.getFullYear()).toBe(2026);
      expect(result.endDate.getMonth()).toBe(1); // February
      expect(result.endDate.getDate()).toBe(14);
    });

    it("computes correct start/end when the date is in the late part of the year (Nov)", () => {
      const result = resolveSeasonFromBoundaries(d(2026, 11, 1), DEFAULT_SEASON_BOUNDARIES);
      expect(result.code).toBe("A");
      expect(result.startDate).toEqual(d(2026, 9, 15));
      expect(result.endDate.getFullYear()).toBe(2027);
      expect(result.endDate.getMonth()).toBe(1); // February
      expect(result.endDate.getDate()).toBe(14);
    });

    it("non-wrapping seasons resolve start/end within the same year", () => {
      const result = resolveSeasonFromBoundaries(d(2026, 4, 1), DEFAULT_SEASON_BOUNDARIES);
      expect(result.startDate).toEqual(d(2026, 2, 15));
      expect(result.endDate.getFullYear()).toBe(2026);
      expect(result.endDate.getMonth()).toBe(5); // June
      expect(result.endDate.getDate()).toBe(15);
    });
  });

  it("throws if no boundary in the given set covers the date (gap in configured boundaries)", () => {
    expect(() => resolveSeasonFromBoundaries(d(2026, 4, 1), [])).toThrow(/No season boundary configured/);
  });
});

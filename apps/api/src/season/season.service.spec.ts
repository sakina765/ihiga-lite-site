import { SeasonService } from "./season.service";

// Local-time Date construction throughout, to stay consistent with SeasonService
// (which reads getMonth()/getDate() in local time).
function d(year: number, month1Indexed: number, day: number): Date {
  return new Date(year, month1Indexed - 1, day);
}

describe("SeasonService", () => {
  let service: SeasonService;

  beforeEach(() => {
    service = new SeasonService();
  });

  describe("mid-season dates", () => {
    it("resolves a date in the middle of Season A (Urugaryi)", () => {
      const result = service.getSeasonByDate(d(2026, 11, 1));
      expect(result.code).toBe("A");
      expect(result.localName).toBe("Urugaryi");
    });

    it("resolves a date in the middle of Season B (Itumba)", () => {
      const result = service.getSeasonByDate(d(2026, 4, 1));
      expect(result.code).toBe("B");
      expect(result.localName).toBe("Itumba");
    });

    it("resolves a date in the middle of Season C (Impeshyi)", () => {
      const result = service.getSeasonByDate(d(2026, 8, 1));
      expect(result.code).toBe("C");
      expect(result.localName).toBe("Impeshyi");
    });
  });

  describe("boundary edge dates", () => {
    it("Feb 14 is the last day of Season A", () => {
      expect(service.getSeasonByDate(d(2026, 2, 14)).code).toBe("A");
    });

    it("Feb 15 is the first day of Season B", () => {
      expect(service.getSeasonByDate(d(2026, 2, 15)).code).toBe("B");
    });

    it("Jun 15 is the last day of Season B", () => {
      expect(service.getSeasonByDate(d(2026, 6, 15)).code).toBe("B");
    });

    it("Jun 16 is the first day of Season C", () => {
      expect(service.getSeasonByDate(d(2026, 6, 16)).code).toBe("C");
    });

    it("Sept 14 is the last day of Season C", () => {
      expect(service.getSeasonByDate(d(2026, 9, 14)).code).toBe("C");
    });

    it("Sept 15 is the first day of Season A", () => {
      expect(service.getSeasonByDate(d(2026, 9, 15)).code).toBe("A");
    });
  });

  describe("year-wraparound of Season A", () => {
    it("computes correct start/end when the date is in the early part of the year (Jan)", () => {
      const result = service.getSeasonByDate(d(2026, 1, 10));
      expect(result.code).toBe("A");
      expect(result.startDate).toEqual(d(2025, 9, 15));
      expect(result.endDate.getFullYear()).toBe(2026);
      expect(result.endDate.getMonth()).toBe(1); // February
      expect(result.endDate.getDate()).toBe(14);
    });

    it("computes correct start/end when the date is in the late part of the year (Nov)", () => {
      const result = service.getSeasonByDate(d(2026, 11, 1));
      expect(result.code).toBe("A");
      expect(result.startDate).toEqual(d(2026, 9, 15));
      expect(result.endDate.getFullYear()).toBe(2027);
      expect(result.endDate.getMonth()).toBe(1); // February
      expect(result.endDate.getDate()).toBe(14);
    });

    it("non-wrapping seasons resolve start/end within the same year", () => {
      const result = service.getSeasonByDate(d(2026, 4, 1));
      expect(result.startDate).toEqual(d(2026, 2, 15));
      expect(result.endDate.getFullYear()).toBe(2026);
      expect(result.endDate.getMonth()).toBe(5); // June
      expect(result.endDate.getDate()).toBe(15);
    });
  });

  describe("getCurrentSeason", () => {
    it("defaults to today and returns a valid season", () => {
      const result = service.getCurrentSeason();
      expect(["A", "B", "C"]).toContain(result.code);
    });

    it("matches getSeasonByDate for an explicit date", () => {
      const date = d(2026, 8, 1);
      expect(service.getCurrentSeason(date)).toEqual(service.getSeasonByDate(date));
    });
  });
});

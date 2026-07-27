import { SeasonService } from "./season.service";
import { SeasonBoundaryEntity } from "./entities/season-boundary.entity";
import { DEFAULT_SEASON_BOUNDARIES } from "./season.constants";

function d(year: number, month1Indexed: number, day: number): Date {
  return new Date(year, month1Indexed - 1, day);
}

function makeFakeRepository(rows: SeasonBoundaryEntity[]) {
  return { find: jest.fn().mockResolvedValue(rows) } as unknown as import("typeorm").Repository<SeasonBoundaryEntity>;
}

describe("SeasonService", () => {
  it("resolves a season from boundaries loaded from the repository (DB-backed, not the hardcoded default)", async () => {
    // Deliberately NOT equal to DEFAULT_SEASON_BOUNDARIES — a custom admin
    // edit — to prove getSeasonByDate actually uses what the repository
    // returns rather than silently falling back to the coded default.
    const customBoundaries = [
      { code: "A", localName: "Custom A", englishName: "Custom Season A", startMonth: 1, startDay: 1, endMonth: 4, endDay: 30 },
      { code: "B", localName: "Custom B", englishName: "Custom Season B", startMonth: 5, startDay: 1, endMonth: 8, endDay: 31 },
      { code: "C", localName: "Custom C", englishName: "Custom Season C", startMonth: 9, startDay: 1, endMonth: 12, endDay: 31 },
    ] as SeasonBoundaryEntity[];
    const service = new SeasonService(makeFakeRepository(customBoundaries));

    const result = await service.getSeasonByDate(d(2026, 2, 1));

    expect(result.code).toBe("A");
    expect(result.localName).toBe("Custom A");
  });

  it("falls back to DEFAULT_SEASON_BOUNDARIES if the table is empty", async () => {
    const service = new SeasonService(makeFakeRepository([]));

    const result = await service.getSeasonByDate(d(2026, 11, 1));

    expect(result.code).toBe("A");
    expect(result.localName).toBe(DEFAULT_SEASON_BOUNDARIES.find((b) => b.code === "A")!.localName);
  });

  it("getCurrentSeason defaults to today and delegates to getSeasonByDate", async () => {
    const service = new SeasonService(makeFakeRepository([]));

    const result = await service.getCurrentSeason();

    expect(["A", "B", "C"]).toContain(result.code);
  });
});

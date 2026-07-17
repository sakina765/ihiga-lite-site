export type SeasonCode = "A" | "B" | "C";

export interface SeasonBoundary {
  code: SeasonCode;
  localName: string;
  englishName: string;
  /** 1-indexed (1 = January), year-agnostic */
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

/**
 * Rwanda's agricultural season boundaries. Exact dates vary by source/region
 * by a few weeks — these are approximate and intentionally centralized here
 * so they can be tuned without touching SeasonService's logic.
 */
export const SEASON_BOUNDARIES: SeasonBoundary[] = [
  {
    code: "A",
    localName: "Urugaryi",
    englishName: "Season A (main rainy season)",
    startMonth: 9,
    startDay: 15,
    endMonth: 2,
    endDay: 14,
  },
  {
    code: "B",
    localName: "Itumba",
    englishName: "Season B (second rainy season)",
    startMonth: 2,
    startDay: 15,
    endMonth: 6,
    endDay: 15,
  },
  {
    code: "C",
    localName: "Impeshyi",
    englishName: "Season C (dry season / irrigated & marshland farming)",
    startMonth: 6,
    startDay: 16,
    endMonth: 9,
    endDay: 14,
  },
];

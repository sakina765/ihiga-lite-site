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
 * Rwanda's agricultural season boundaries.
 *
 * As of the admin panel's Phase 3, SeasonService reads the real,
 * admin-editable boundaries from the `season_boundaries` table (seeded with
 * these exact values by migration 1785174000000-CreateSeasonBoundaries) —
 * this array is no longer the source of truth in production. It survives
 * here as SeasonService's defense-in-depth fallback: season resolution runs
 * on every single chat turn with no graceful "no season configured" path
 * (unlike crops/knowledge/sectors, which degrade to an empty result), so if
 * the table is ever found empty (a botched manual migration, a fresh DB
 * whose seed step hasn't run yet), SeasonService falls back to this array
 * rather than throwing and breaking the core chat flow.
 */
export const DEFAULT_SEASON_BOUNDARIES: SeasonBoundary[] = [
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

import { SeasonBoundary } from "./season.constants";
import { SeasonInfo } from "./season.types";

interface MonthDay {
  month: number;
  day: number;
}

function toMonthDay(date: Date): MonthDay {
  return { month: date.getMonth() + 1, day: date.getDate() };
}

function compareMonthDay(a: MonthDay, b: MonthDay): number {
  return a.month !== b.month ? a.month - b.month : a.day - b.day;
}

/** Whether a boundary's start..end range crosses a calendar year (e.g. Sept -> Feb). */
function isWrapping(boundary: SeasonBoundary): boolean {
  return (
    compareMonthDay(
      { month: boundary.startMonth, day: boundary.startDay },
      { month: boundary.endMonth, day: boundary.endDay },
    ) > 0
  );
}

function matchesBoundary(md: MonthDay, boundary: SeasonBoundary): boolean {
  const start = { month: boundary.startMonth, day: boundary.startDay };
  const end = { month: boundary.endMonth, day: boundary.endDay };

  if (!isWrapping(boundary)) {
    return compareMonthDay(md, start) >= 0 && compareMonthDay(md, end) <= 0;
  }
  return compareMonthDay(md, start) >= 0 || compareMonthDay(md, end) <= 0;
}

/** Resolves the concrete (year-bound) start/end Date instances for the season a given date falls in. */
function resolveYearBounds(date: Date, boundary: SeasonBoundary): { startDate: Date; endDate: Date } {
  const year = date.getFullYear();
  const md = toMonthDay(date);

  if (!isWrapping(boundary)) {
    return {
      startDate: new Date(year, boundary.startMonth - 1, boundary.startDay),
      endDate: new Date(year, boundary.endMonth - 1, boundary.endDay, 23, 59, 59, 999),
    };
  }

  const start = { month: boundary.startMonth, day: boundary.startDay };
  const inLatePartOfYear = compareMonthDay(md, start) >= 0;

  if (inLatePartOfYear) {
    // e.g. date is in Sept-Dec: season started this year, ends next year
    return {
      startDate: new Date(year, boundary.startMonth - 1, boundary.startDay),
      endDate: new Date(year + 1, boundary.endMonth - 1, boundary.endDay, 23, 59, 59, 999),
    };
  }
  // e.g. date is in Jan-Feb: season started last year, ends this year
  return {
    startDate: new Date(year - 1, boundary.startMonth - 1, boundary.startDay),
    endDate: new Date(year, boundary.endMonth - 1, boundary.endDay, 23, 59, 59, 999),
  };
}

/**
 * Pure date-math core of season resolution — deliberately independent of
 * where `boundaries` came from (the database, in production, via
 * SeasonService; a fixture, in tests) so it stays trivially unit-testable
 * without a database. `boundaries` is expected to cover the full year with
 * no gaps.
 */
export function resolveSeasonFromBoundaries(date: Date, boundaries: SeasonBoundary[]): SeasonInfo {
  const md = toMonthDay(date);
  const boundary = boundaries.find((b) => matchesBoundary(md, b));

  if (!boundary) {
    throw new Error(`No season boundary configured for date ${date.toISOString()}`);
  }

  const { startDate, endDate } = resolveYearBounds(date, boundary);

  return {
    code: boundary.code,
    localName: boundary.localName,
    englishName: boundary.englishName,
    startDate,
    endDate,
  };
}

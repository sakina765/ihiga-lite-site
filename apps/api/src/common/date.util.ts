import { BadRequestException } from "@nestjs/common";

/**
 * Parses a "YYYY-MM-DD" string into a local-time Date (00:00 local), avoiding
 * the UTC-midnight shift you'd get from `new Date(str)` on a date-only string.
 */
export function parseIsoDateStringLocal(value: string, paramName = "date"): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new BadRequestException(`${paramName} must be in YYYY-MM-DD format`);
  }
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${paramName} is not a valid date`);
  }
  return date;
}

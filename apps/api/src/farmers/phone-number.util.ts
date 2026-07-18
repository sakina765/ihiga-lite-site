import { BadRequestException } from "@nestjs/common";

/**
 * Normalizes common Rwandan phone number formats — 0788123456, +250788123456,
 * 250788123456, 788123456, with optional spaces/dashes/dots/parens — down to a
 * single stored E.164-ish form: +2507XXXXXXXX. Throws BadRequestException for
 * anything that doesn't match one of these shapes rather than silently
 * accepting garbage.
 */
export function normalizePhoneNumber(input: string): string {
  const cleaned = input.replace(/[\s\-().]/g, "");

  const patterns: RegExp[] = [/^\+2507(\d{8})$/, /^2507(\d{8})$/, /^07(\d{8})$/, /^7(\d{8})$/];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      return `+2507${match[1]}`;
    }
  }

  throw new BadRequestException(
    `"${input}" doesn't look like a valid Rwandan phone number (expected formats like 0788123456 or +250788123456)`,
  );
}

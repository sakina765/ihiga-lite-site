import { IsIn, IsLatitude, IsLongitude, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { ChatLanguage } from "../../ai/types";

export class RegisterFarmerDto {
  // Exact format (0788123456 / +250788123456 / etc.) is enforced by
  // normalizePhoneNumber() in the service — this just bounds the length
  // before that regex work ever runs.
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  phoneNumber: string;

  // Backward-compat flat district string — the cascading picker no longer
  // sends this on its own (it sends sectorId), but older callers/tests may.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  /** Sector chosen via the cascading location picker (manually or GPS-auto-filled-then-reviewed). */
  @IsOptional()
  @IsUUID()
  sectorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  villageText?: string;

  /** UI language chosen at onboarding (Phase 9) — becomes the authoritative override for Groq's replies too. */
  @IsOptional()
  @IsIn(["en", "rw", "fr"])
  preferredLanguage?: ChatLanguage;
}

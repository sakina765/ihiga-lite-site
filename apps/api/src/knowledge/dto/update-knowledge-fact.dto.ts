import { IsArray, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

/**
 * Every field is optional (a partial update) — cropId and factTextRw
 * additionally accept an explicit `null` (distinct from omitting the field)
 * to clear an existing value, since IsOptional() skips validation for both
 * `undefined` and `null`. The service distinguishes "not sent" (leave alone)
 * from "sent as null" (clear it) by checking for the key's presence, not just
 * its value.
 */
export class UpdateKnowledgeFactDto {
  @IsOptional()
  @IsUUID()
  cropId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  topic?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  factText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  factTextRw?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  source?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

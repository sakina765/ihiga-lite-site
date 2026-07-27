import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class AdminUpdateCropDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  localName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, { message: "slug must be lowercase letters/numbers separated by hyphens, e.g. \"sweet-potato\"" })
  @MaxLength(100)
  slug?: string;

  // "" clears the description (treated as null) — same convention as
  // UpdateKnowledgeFactDto's factTextRw.
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

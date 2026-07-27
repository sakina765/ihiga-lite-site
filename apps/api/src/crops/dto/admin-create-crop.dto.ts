import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class AdminCreateCropDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  localName: string;

  // Matches the shape GroqService's extraction already expects (see SLUG_SHAPE_RE
  // in groq.service.ts) — lowercase, hyphen-separated, no spaces/punctuation.
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, { message: "slug must be lowercase letters/numbers separated by hyphens, e.g. \"sweet-potato\"" })
  @MaxLength(100)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

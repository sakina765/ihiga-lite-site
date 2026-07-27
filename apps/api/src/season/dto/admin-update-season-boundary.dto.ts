import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class AdminUpdateSeasonBoundaryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  localName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  englishName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  startDay?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  endDay?: number;
}

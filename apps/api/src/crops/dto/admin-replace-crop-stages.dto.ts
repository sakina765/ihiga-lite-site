import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";

export class CropStageInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsInt()
  @Min(0)
  @Max(520) // 10 years of weeks — a generous ceiling against obvious typos, not a real agronomic limit
  weekStart: number;

  @IsInt()
  @Min(0)
  @Max(520)
  weekEnd: number;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  taskDescription: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  taskDescriptionRw: string;
}

/**
 * Replaces a crop's ENTIRE stage list atomically, in the order given —
 * orderIndex is assigned server-side from array position. Mirrors
 * seed-crops.ts's own idempotent "delete all + recreate" idiom, which avoids
 * a whole class of partial-reorder bugs a per-stage PATCH/reorder API would
 * otherwise need to handle explicitly.
 */
export class AdminReplaceCropStagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CropStageInputDto)
  stages: CropStageInputDto[];
}

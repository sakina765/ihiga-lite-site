import { IsIn, IsOptional, IsString, IsUUID } from "class-validator";

export class AdminKnowledgeQueryDto {
  @IsOptional()
  @IsUUID()
  cropId?: string;

  @IsOptional()
  @IsString()
  topic?: string;

  // Filters to just-unreviewed or just-reviewed facts — omit to see both.
  @IsOptional()
  @IsIn(["true", "false"])
  reviewed?: "true" | "false";
}

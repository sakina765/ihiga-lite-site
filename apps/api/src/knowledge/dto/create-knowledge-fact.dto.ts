import { IsArray, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateKnowledgeFactDto {
  // Nullable — some facts are crop-agnostic (general soil/weather guidance).
  @IsOptional()
  @IsUUID()
  cropId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  topic: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  factText: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  factTextRw?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  source: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

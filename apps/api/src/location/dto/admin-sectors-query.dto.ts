import { IsOptional, IsString, MaxLength } from "class-validator";

export class AdminSectorsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;
}

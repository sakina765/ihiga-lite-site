import { IsString, MinLength } from "class-validator";

export class SectorsQueryDto {
  @IsString()
  @MinLength(1)
  district: string;
}

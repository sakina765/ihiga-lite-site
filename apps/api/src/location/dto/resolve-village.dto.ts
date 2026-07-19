import { IsString, IsUUID, MinLength } from "class-validator";

export class ResolveVillageDto {
  @IsUUID()
  sectorId: string;

  @IsString()
  @MinLength(1)
  villageText: string;
}

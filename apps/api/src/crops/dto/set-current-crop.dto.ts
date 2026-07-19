import { IsUUID, Matches } from "class-validator";

export class SetCurrentCropDto {
  @IsUUID()
  farmerId: string;

  @IsUUID()
  cropId: string;

  /** YYYY-MM-DD */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "plantingDate must be in YYYY-MM-DD format" })
  plantingDate: string;
}

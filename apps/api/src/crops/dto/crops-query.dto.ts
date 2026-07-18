import { IsUUID } from "class-validator";

export class CropsQueryDto {
  @IsUUID()
  farmerId: string;
}

import { IsUUID } from "class-validator";

export class WeatherQueryDto {
  @IsUUID()
  farmerId: string;
}

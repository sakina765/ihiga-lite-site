import { Type } from "class-transformer";
import { IsLatitude, IsLongitude } from "class-validator";

export class NearestSectorQueryDto {
  // @Type(() => Number) is required here — this is the first numeric query
  // DTO in this codebase; the global ValidationPipe's `transform: true` does
  // NOT imply implicit string->number conversion (enableImplicitConversion
  // isn't set), so without this the raw query string would fail @IsLatitude.
  @Type(() => Number)
  @IsLatitude()
  lat: number;

  @Type(() => Number)
  @IsLongitude()
  lng: number;
}

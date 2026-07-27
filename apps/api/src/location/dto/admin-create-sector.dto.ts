import { IsBoolean, IsLatitude, IsLongitude, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class AdminCreateSectorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  district: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameRw?: string;

  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;

  // Defaults to true (server-side) if omitted — a coordinate an admin hasn't
  // explicitly vouched for as real/surveyed is assumed approximated, the same
  // conservative default the Sector entity itself uses.
  @IsOptional()
  @IsBoolean()
  coordinatesApproximated?: boolean;
}

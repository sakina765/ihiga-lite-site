import { IsBoolean, IsLatitude, IsLongitude, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class AdminUpdateSectorDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameRw?: string;

  @IsOptional()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsLongitude()
  lng?: number;

  @IsOptional()
  @IsBoolean()
  coordinatesApproximated?: boolean;
}

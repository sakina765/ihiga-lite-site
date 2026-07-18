import { IsLatitude, IsLongitude, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterFarmerDto {
  // Exact format (0788123456 / +250788123456 / etc.) is enforced by
  // normalizePhoneNumber() in the service — this just bounds the length
  // before that regex work ever runs.
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  phoneNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}

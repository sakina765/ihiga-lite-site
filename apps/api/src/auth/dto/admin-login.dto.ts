import { IsString, MaxLength, MinLength } from "class-validator";

export class AdminLoginDto {
  // Exact format enforced by normalizePhoneNumber() in AuthService — this just bounds length first.
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  phoneNumber: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password: string;
}

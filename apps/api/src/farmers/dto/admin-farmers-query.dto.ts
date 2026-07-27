import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class AdminFarmersQueryDto {
  // Matches phone number OR district (see FarmersService.adminList) — no
  // format validation beyond length, since this is an ILIKE substring match,
  // not normalizePhoneNumber's strict farmer-registration parsing.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

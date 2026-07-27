import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { SeasonService } from "./season.service";
import { SeasonBoundaryEntity } from "./entities/season-boundary.entity";
import { SeasonCode } from "./season.constants";
import { AdminUpdateSeasonBoundaryDto } from "./dto/admin-update-season-boundary.dto";
import { AdminGuard } from "../auth/admin.guard";

@Controller("admin/season-boundaries")
@UseGuards(AdminGuard)
export class AdminSeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  @Get()
  list(): Promise<SeasonBoundaryEntity[]> {
    return this.seasonService.adminList();
  }

  // Not a UUID like the rest of the admin API's :id params — this is always
  // exactly "A", "B", or "C" (see SeasonBoundaryEntity's own doc comment on
  // why the season code IS the primary key). An unrecognized code just
  // 404s via the same lookup miss as any other nonexistent id would.
  @Patch(":code")
  update(@Param("code") code: string, @Body() body: AdminUpdateSeasonBoundaryDto): Promise<SeasonBoundaryEntity> {
    return this.seasonService.adminUpdate(code as SeasonCode, body);
  }
}

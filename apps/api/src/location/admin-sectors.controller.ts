import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { SectorsService } from "./sectors.service";
import { Sector } from "./entities/sector.entity";
import { AdminCreateSectorDto } from "./dto/admin-create-sector.dto";
import { AdminUpdateSectorDto } from "./dto/admin-update-sector.dto";
import { AdminSectorsQueryDto } from "./dto/admin-sectors-query.dto";
import { AdminGuard } from "../auth/admin.guard";

@Controller("admin/sectors")
@UseGuards(AdminGuard)
export class AdminSectorsController {
  constructor(private readonly sectorsService: SectorsService) {}

  @Get()
  list(@Query() query: AdminSectorsQueryDto): Promise<Sector[]> {
    return this.sectorsService.adminList(query.district);
  }

  @Post()
  create(@Body() body: AdminCreateSectorDto): Promise<Sector> {
    return this.sectorsService.create(body);
  }

  @Patch(":id")
  update(@Param("id", new ParseUUIDPipe()) id: string, @Body() body: AdminUpdateSectorDto): Promise<Sector> {
    return this.sectorsService.update(id, body);
  }

  // Fetched by the admin UI before showing the delete-confirmation dialog —
  // see SectorsService.getTrackingCount's doc comment.
  @Get(":id/impact")
  async impact(@Param("id", new ParseUUIDPipe()) id: string): Promise<{ trackingFarmersCount: number }> {
    return { trackingFarmersCount: await this.sectorsService.getTrackingCount(id) };
  }

  @Delete(":id")
  @HttpCode(204)
  delete(@Param("id", new ParseUUIDPipe()) id: string): Promise<void> {
    return this.sectorsService.delete(id);
  }
}

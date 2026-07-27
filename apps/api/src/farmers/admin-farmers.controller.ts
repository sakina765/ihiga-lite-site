import { Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from "@nestjs/common";
import { AdminFarmerDetail, AdminFarmerListItem, AdminFarmerProfile, FarmersService } from "./farmers.service";
import { AdminFarmersQueryDto } from "./dto/admin-farmers-query.dto";
import { AdminGuard } from "../auth/admin.guard";

export interface AdminFarmersListResponse {
  items: AdminFarmerListItem[];
  total: number;
  page: number;
  pageSize: number;
}

@Controller("admin/farmers")
@UseGuards(AdminGuard)
export class AdminFarmersController {
  constructor(private readonly farmersService: FarmersService) {}

  @Get()
  async list(@Query() query: AdminFarmersQueryDto): Promise<AdminFarmersListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { items, total } = await this.farmersService.adminList({ search: query.search, page, pageSize });
    return { items, total, page, pageSize };
  }

  @Get(":id")
  getDetail(@Param("id", new ParseUUIDPipe()) id: string): Promise<AdminFarmerDetail> {
    return this.farmersService.adminGetDetail(id);
  }

  @Patch(":id/deactivate")
  deactivate(@Param("id", new ParseUUIDPipe()) id: string): Promise<AdminFarmerProfile> {
    return this.farmersService.deactivate(id);
  }

  @Patch(":id/reactivate")
  reactivate(@Param("id", new ParseUUIDPipe()) id: string): Promise<AdminFarmerProfile> {
    return this.farmersService.reactivate(id);
  }
}

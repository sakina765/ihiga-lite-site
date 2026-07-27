import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put, UseGuards } from "@nestjs/common";
import { CropsService } from "./crops.service";
import { Crop } from "./entities/crop.entity";
import { CropStage } from "./entities/crop-stage.entity";
import { AdminCreateCropDto } from "./dto/admin-create-crop.dto";
import { AdminUpdateCropDto } from "./dto/admin-update-crop.dto";
import { AdminReplaceCropStagesDto } from "./dto/admin-replace-crop-stages.dto";
import { AdminGuard } from "../auth/admin.guard";

@Controller("admin/crops")
@UseGuards(AdminGuard)
export class AdminCropsController {
  constructor(private readonly cropsService: CropsService) {}

  @Get()
  list(): Promise<Crop[]> {
    return this.cropsService.adminList();
  }

  @Post()
  create(@Body() body: AdminCreateCropDto): Promise<Crop> {
    return this.cropsService.create(body);
  }

  @Patch(":id")
  update(@Param("id", new ParseUUIDPipe()) id: string, @Body() body: AdminUpdateCropDto): Promise<Crop> {
    return this.cropsService.update(id, body);
  }

  // Fetched by the admin UI before showing the delete-confirmation dialog —
  // see CropsService.getTrackingCount's doc comment.
  @Get(":id/impact")
  async impact(@Param("id", new ParseUUIDPipe()) id: string): Promise<{ trackingConversationsCount: number }> {
    return { trackingConversationsCount: await this.cropsService.getTrackingCount(id) };
  }

  @Delete(":id")
  @HttpCode(204)
  delete(@Param("id", new ParseUUIDPipe()) id: string): Promise<void> {
    return this.cropsService.delete(id);
  }

  @Put(":id/stages")
  replaceStages(@Param("id", new ParseUUIDPipe()) id: string, @Body() body: AdminReplaceCropStagesDto): Promise<CropStage[]> {
    return this.cropsService.replaceStages(id, body.stages);
  }
}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Crop } from "./entities/crop.entity";
import { CropStage } from "./entities/crop-stage.entity";
import { CropsService } from "./crops.service";

@Module({
  imports: [TypeOrmModule.forFeature([Crop, CropStage])],
  providers: [CropsService],
  exports: [CropsService],
})
export class CropsModule {}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Crop } from "./entities/crop.entity";
import { CropStage } from "./entities/crop-stage.entity";
import { Conversation } from "../chat/entities/conversation.entity";
import { CropsService } from "./crops.service";
import { CropSuggestionsService } from "./crop-suggestions.service";
import { CurrentCropService } from "./current-crop.service";
import { CropsController } from "./crops.controller";
import { SeasonModule } from "../season/season.module";
import { FarmersModule } from "../farmers/farmers.module";

@Module({
  // Registers the Conversation entity for its own repository here — importing
  // only the entity class, not ChatModule itself, so there's no circular
  // dependency (ChatModule already imports CropsModule, not the reverse).
  imports: [TypeOrmModule.forFeature([Crop, CropStage, Conversation]), SeasonModule, FarmersModule],
  providers: [CropsService, CropSuggestionsService, CurrentCropService],
  controllers: [CropsController],
  exports: [CropsService, CropSuggestionsService],
})
export class CropsModule {}

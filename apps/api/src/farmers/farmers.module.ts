import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Farmer } from "./entities/farmer.entity";
import { Conversation } from "../chat/entities/conversation.entity";
import { Message } from "../chat/entities/message.entity";
import { Crop } from "../crops/entities/crop.entity";
import { FarmersService } from "./farmers.service";
import { FarmersController } from "./farmers.controller";
import { AdminFarmersController } from "./admin-farmers.controller";
import { LocationModule } from "../location/location.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  // LocationModule (SectorsService + GeocodingService) resolves sectorId/villageText
  // into a final farm coordinate at registration time. One-directional dependency —
  // LocationModule never imports FarmersModule — so no circular-import risk.
  //
  // Conversation/Message/Crop are registered as bare entities (not by importing
  // ChatModule/CropsModule) so the admin farmer-oversight queries (tracked crop,
  // conversation list, message counts) can read them directly — the same
  // established pattern CropsModule already uses for the Conversation entity.
  imports: [TypeOrmModule.forFeature([Farmer, Conversation, Message, Crop]), LocationModule, AuthModule],
  providers: [FarmersService],
  controllers: [FarmersController, AdminFarmersController],
  exports: [FarmersService],
})
export class FarmersModule {}

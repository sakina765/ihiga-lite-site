import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Farmer } from "./entities/farmer.entity";
import { FarmersService } from "./farmers.service";
import { FarmersController } from "./farmers.controller";
import { LocationModule } from "../location/location.module";

@Module({
  // LocationModule (SectorsService + GeocodingService) resolves sectorId/villageText
  // into a final farm coordinate at registration time. One-directional dependency —
  // LocationModule never imports FarmersModule — so no circular-import risk.
  imports: [TypeOrmModule.forFeature([Farmer]), LocationModule],
  providers: [FarmersService],
  controllers: [FarmersController],
  exports: [FarmersService],
})
export class FarmersModule {}

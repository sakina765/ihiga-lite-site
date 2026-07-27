import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Sector } from "./entities/sector.entity";
import { VillageGeocodeCache } from "./entities/village-geocode-cache.entity";
import { Farmer } from "../farmers/entities/farmer.entity";
import { SectorsService } from "./sectors.service";
import { GeocodingService } from "./geocoding.service";
import { LocationController } from "./location.controller";
import { AdminSectorsController } from "./admin-sectors.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  // Farmer registered as a bare entity (not by importing FarmersModule) —
  // FarmersModule already imports LocationModule, so the reverse would be a
  // circular dependency. Only used for SectorsService's admin delete-impact
  // count. Same established pattern as CropsModule registering Conversation.
  imports: [TypeOrmModule.forFeature([Sector, VillageGeocodeCache, Farmer]), AuthModule],
  providers: [SectorsService, GeocodingService],
  controllers: [LocationController, AdminSectorsController],
  exports: [SectorsService, GeocodingService],
})
export class LocationModule {}

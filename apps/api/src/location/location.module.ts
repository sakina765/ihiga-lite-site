import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Sector } from "./entities/sector.entity";
import { VillageGeocodeCache } from "./entities/village-geocode-cache.entity";
import { SectorsService } from "./sectors.service";
import { GeocodingService } from "./geocoding.service";
import { LocationController } from "./location.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Sector, VillageGeocodeCache])],
  providers: [SectorsService, GeocodingService],
  controllers: [LocationController],
  exports: [SectorsService, GeocodingService],
})
export class LocationModule {}

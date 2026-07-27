import { Module } from "@nestjs/common";
import { WeatherService } from "./weather.service";
import { WeatherController } from "./weather.controller";
import { AdminDistrictsController } from "./admin-districts.controller";
import { FarmersModule } from "../farmers/farmers.module";
import { LocationModule } from "../location/location.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  // LocationModule (SectorsService) powers the sidebar's District -> Sector
  // weather drill-down (GET /weather/sectors). One-directional — LocationModule
  // never imports WeatherModule — so no circular-import risk.
  imports: [FarmersModule, LocationModule, AuthModule],
  providers: [WeatherService],
  controllers: [WeatherController, AdminDistrictsController],
  exports: [WeatherService],
})
export class WeatherModule {}

import { Controller, Get, Query } from "@nestjs/common";
import { WeatherService } from "./weather.service";
import { WeatherQueryDto } from "./dto/weather-query.dto";
import { WeatherInfo } from "./weather.types";
import { RWANDA_PROVINCE_DISTRICTS } from "./rwanda-provinces";
import { FarmersService } from "../farmers/farmers.service";

export interface TodayWeatherResponse {
  district: WeatherInfo | null;
  farmExact?: WeatherInfo;
}

export interface ProvinceWeatherRollup {
  province: string;
  districts: { district: string; weather: WeatherInfo }[];
}

@Controller("weather")
export class WeatherController {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly farmersService: FarmersService,
  ) {}

  /** Sidebar section 1 — today's weather for the farmer's own district, plus farm-exact GPS weather if shared. */
  @Get("today")
  async today(@Query() query: WeatherQueryDto): Promise<TodayWeatherResponse> {
    const farmer = await this.farmersService.getById(query.farmerId);
    if (!farmer?.district) {
      return { district: null };
    }

    const district = await this.weatherService.getForecast(farmer.district);
    const farmExact =
      farmer.farmLatitude != null && farmer.farmLongitude != null
        ? await this.weatherService.getForecastByCoordinates(farmer.farmLatitude, farmer.farmLongitude, farmer.district)
        : undefined;

    return { district, farmExact };
  }

  /**
   * Sidebar section 2 — cumulative weather rollup across all 5 provinces.
   * Deliberately farmer-agnostic (no farmerId) so it stays one dataset shared
   * by every visitor and benefits from WeatherService's existing per-district
   * cache; the frontend overlays the farmer's own farm-exact weather from
   * /weather/today client-side instead of computing it per-request here.
   */
  @Get("provinces")
  async provinces(): Promise<ProvinceWeatherRollup[]> {
    return Promise.all(
      Object.entries(RWANDA_PROVINCE_DISTRICTS).map(async ([province, districts]) => ({
        province,
        districts: await Promise.all(
          districts.map(async (district) => ({ district, weather: await this.weatherService.getForecast(district) })),
        ),
      })),
    );
  }
}

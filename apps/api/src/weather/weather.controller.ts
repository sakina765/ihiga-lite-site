import { Controller, Get, Logger, Query } from "@nestjs/common";
import { WeatherService } from "./weather.service";
import { WeatherQueryDto } from "./dto/weather-query.dto";
import { WeatherInfo } from "./weather.types";
import { RWANDA_PROVINCE_DISTRICTS } from "./rwanda-provinces";
import { FarmersService } from "../farmers/farmers.service";
import { SectorsService } from "../location/sectors.service";
import { SectorsQueryDto } from "../location/dto/sectors-query.dto";

export interface TodayWeatherResponse {
  district: WeatherInfo | null;
  farmExact?: WeatherInfo;
}

export interface ProvinceWeatherRollup {
  province: string;
  districts: { district: string; weather: WeatherInfo }[];
}

export interface SectorWeatherRow {
  id: string;
  name: string;
  nameRw: string | null;
  weather: WeatherInfo;
}

@Controller("weather")
export class WeatherController {
  private readonly logger = new Logger(WeatherController.name);

  constructor(
    private readonly weatherService: WeatherService,
    private readonly farmersService: FarmersService,
    private readonly sectorsService: SectorsService,
  ) {}

  /** Sidebar section 1 — today's weather for the farmer's own district, plus farm-exact weather if a coordinate is known. */
  @Get("today")
  async today(@Query() query: WeatherQueryDto): Promise<TodayWeatherResponse> {
    const farmer = await this.farmersService.getById(query.farmerId);
    if (!farmer?.district) {
      return { district: null };
    }

    const district = await this.weatherService.getForecast(farmer.district);

    // Precedence: resolvedLatitude/resolvedLongitude (geocoded village > sector
    // centroid, set by the cascading picker at registration) beats the raw
    // farmLatitude/farmLongitude GPS reading — see farmer.entity.ts.
    const exactLatitude = farmer.resolvedLatitude ?? farmer.farmLatitude;
    const exactLongitude = farmer.resolvedLongitude ?? farmer.farmLongitude;
    const farmExact =
      exactLatitude != null && exactLongitude != null
        ? await this.weatherService.getForecastByCoordinates(exactLatitude, exactLongitude, farmer.district)
        : undefined;

    return { district, farmExact };
  }

  /**
   * Sidebar's District -> Sector drill-down — weather for every sector in one
   * district, fetched lazily (only when a farmer expands that district), never
   * eagerly for all 416 seeded sectors at once. A single sector's Open-Meteo
   * call failing (rate limit, transient network blip) drops just that sector
   * from the response rather than 500ing the whole district's drill-down —
   * see the identical reasoning on provinces() below, where this was first
   * observed in practice.
   */
  @Get("sectors")
  async sectors(@Query() query: SectorsQueryDto): Promise<SectorWeatherRow[]> {
    const sectors = await this.sectorsService.getByDistrict(query.district);
    const rows = await Promise.all(
      sectors.map(async (sector): Promise<SectorWeatherRow | null> => {
        try {
          return {
            id: sector.id,
            name: sector.name,
            nameRw: sector.nameRw,
            weather: await this.weatherService.getForecastByCoordinates(sector.lat, sector.lng, sector.name),
          };
        } catch (error) {
          this.logger.warn(`Skipping sector "${sector.name}" in provinces/sectors rollup — forecast fetch failed: ${error instanceof Error ? error.message : error}`);
          return null;
        }
      }),
    );
    return rows.filter((row): row is SectorWeatherRow => row !== null);
  }

  /**
   * Sidebar section 2 — cumulative weather rollup across all 5 provinces.
   * Deliberately farmer-agnostic (no farmerId) so it stays one dataset shared
   * by every visitor and benefits from WeatherService's existing per-district
   * cache; the frontend overlays the farmer's own farm-exact weather from
   * /weather/today client-side instead of computing it per-request here.
   *
   * Each district's forecast is fetched independently and failures are
   * swallowed per-district (logged, then that district is omitted) — this
   * endpoint fires ~30 concurrent Open-Meteo calls (one per district), and an
   * unguarded Promise.all would 500 the ENTIRE regional weather section over
   * a single district's transient failure. Observed in practice, not
   * speculative: this exact failure mode surfaced during manual testing.
   */
  @Get("provinces")
  async provinces(): Promise<ProvinceWeatherRollup[]> {
    return Promise.all(
      Object.entries(RWANDA_PROVINCE_DISTRICTS).map(async ([province, districts]) => {
        const rows = await Promise.all(
          districts.map(async (district): Promise<{ district: string; weather: WeatherInfo } | null> => {
            try {
              return { district, weather: await this.weatherService.getForecast(district) };
            } catch (error) {
              this.logger.warn(`Skipping district "${district}" in provinces rollup — forecast fetch failed: ${error instanceof Error ? error.message : error}`);
              return null;
            }
          }),
        );
        return { province, districts: rows.filter((row): row is { district: string; weather: WeatherInfo } => row !== null) };
      }),
    );
  }
}

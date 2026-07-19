import { Injectable, Logger } from "@nestjs/common";
import { RWANDA_DISTRICT_COORDINATES } from "./rwanda-districts";
import { WeatherInfo } from "./weather.types";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

// No need to hit Open-Meteo on every single chat message — the weather for a
// district won't meaningfully change within an hour. In-memory is fine at this
// project's scale (single process); it just won't survive a restart or share
// across multiple instances. A DB-backed cache table would be the natural
// upgrade if this ever runs multi-instance.
const CACHE_TTL_MS = 60 * 60 * 1000;

const HEAVY_RAIN_MM_THRESHOLD = 10;
const HIGH_RAIN_PROBABILITY_THRESHOLD = 70;

interface OpenMeteoDailyResponse {
  daily: {
    time: string[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
    temperature_2m_max: number[];
  };
}

interface CacheEntry {
  data: WeatherInfo;
  expiresAt: number;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly cache = new Map<string, CacheEntry>();

  async getForecast(district: string): Promise<WeatherInfo> {
    const cached = this.cache.get(district);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const coordinates = RWANDA_DISTRICT_COORDINATES[district];
    if (!coordinates) {
      // All 30 official districts are covered as of Phase 6 (see
      // rwanda-districts.ts), so this should be rare — most likely a typo'd or
      // unrecognized district name. The caller (ChatOrchestratorService)
      // catches this and proceeds without weather context rather than crashing.
      throw new Error(`Weather unavailable for this area — no coordinates configured for district "${district}"`);
    }

    return this.fetchAndCache(district, coordinates.lat, coordinates.lon, district);
  }

  /**
   * Farm-exact forecast from the farmer's own shared GPS coordinate, rather
   * than a district centroid — for the chat sidebar once a farmer has opted
   * in to sharing their location at onboarding. `districtLabel` is the
   * farmer's own registered district (the coordinate lies within it), used
   * only as WeatherInfo.district's display label — not looked up again.
   */
  async getForecastByCoordinates(latitude: number, longitude: number, districtLabel: string): Promise<WeatherInfo> {
    const cacheKey = `coord:${latitude.toFixed(3)},${longitude.toFixed(3)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    return this.fetchAndCache(cacheKey, latitude, longitude, districtLabel);
  }

  private async fetchAndCache(cacheKey: string, lat: number, lon: number, displayLabel: string): Promise<WeatherInfo> {
    const url = new URL(OPEN_METEO_URL);
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("daily", "precipitation_probability_max,precipitation_sum,temperature_2m_max");
    url.searchParams.set("timezone", "Africa/Kigali");
    url.searchParams.set("forecast_days", "5");

    const startedAt = Date.now();
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Open-Meteo request failed with status ${response.status}`);
    }
    const body = (await response.json()) as OpenMeteoDailyResponse;
    const latencyMs = Date.now() - startedAt;

    const outlook = body.daily.time.map((date, i) => ({
      date,
      rainfallProbability: body.daily.precipitation_probability_max[i],
      rainfallMm: body.daily.precipitation_sum[i],
    }));

    const today = outlook[0];
    const heavyRain = today.rainfallMm >= HEAVY_RAIN_MM_THRESHOLD || today.rainfallProbability >= HIGH_RAIN_PROBABILITY_THRESHOLD;

    const info: WeatherInfo = {
      district: displayLabel,
      todayTemperatureC: Math.round(body.daily.temperature_2m_max[0]),
      todayRainfallProbability: today.rainfallProbability,
      todayRainfallMm: today.rainfallMm,
      soilWorkable: !heavyRain,
      soilWorkableReason: heavyRain ? "Heavy rain expected today — wait before working the soil." : undefined,
      outlook,
      fetchedAt: new Date().toISOString(),
    };

    this.cache.set(cacheKey, { data: info, expiresAt: Date.now() + CACHE_TTL_MS });
    this.logger.log(
      `getForecast [open-meteo] ok — label=${displayLabel} latencyMs=${latencyMs} ` +
        `todayRainMm=${today.rainfallMm} todayRainProb=${today.rainfallProbability}% soilWorkable=${info.soilWorkable}`,
    );

    return info;
  }
}

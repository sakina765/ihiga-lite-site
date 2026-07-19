import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { VillageGeocodeCache } from "./entities/village-geocode-cache.entity";
import { SectorsService } from "./sectors.service";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
// Nominatim's fair-use policy asks for roughly 1 request/second — this is a
// one-time lookup per unique (sectorId, villageText) pair (see the cache
// check below), never a live/repeated call, so this only ever throttles
// back-to-back NEW villages being resolved in quick succession.
const MIN_REQUEST_INTERVAL_MS = 1100;

export interface ResolvedCoordinate {
  lat: number;
  lng: number;
}

interface NominatimResult {
  lat: string;
  lon: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private lastRequestAt = 0;

  constructor(
    @InjectRepository(VillageGeocodeCache) private readonly cacheRepository: Repository<VillageGeocodeCache>,
    private readonly sectorsService: SectorsService,
  ) {}

  /**
   * Resolves a free-text village/cell name to a coordinate, scoped to its
   * sector's district for match accuracy. Returns null gracefully (never
   * throws to the caller) if no confident match is found — the UI falls back
   * to the sector's own coordinate in that case, per spec.
   */
  async resolveVillage(sectorId: string, villageText: string): Promise<ResolvedCoordinate | null> {
    const normalized = villageText.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    const cached = await this.cacheRepository.findOne({ where: { sectorId, villageText: normalized } });
    if (cached) {
      return cached.found && cached.resolvedLatitude != null && cached.resolvedLongitude != null
        ? { lat: cached.resolvedLatitude, lng: cached.resolvedLongitude }
        : null;
    }

    const sector = await this.sectorsService.getById(sectorId);
    if (!sector) {
      return null;
    }

    let result: ResolvedCoordinate | null = null;
    try {
      await this.respectRateLimit();
      result = await this.queryNominatim(normalized, sector.name, sector.district);
    } catch (error) {
      this.logger.warn(`Nominatim lookup failed for "${villageText}" (sector ${sector.name}): ${error instanceof Error ? error.message : error}`);
      result = null;
    }

    await this.cacheRepository.save(
      this.cacheRepository.create({
        sectorId,
        villageText: normalized,
        found: result !== null,
        resolvedLatitude: result?.lat ?? null,
        resolvedLongitude: result?.lng ?? null,
      }),
    );

    return result;
  }

  private async respectRateLimit(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed));
    }
    this.lastRequestAt = Date.now();
  }

  private async queryNominatim(villageText: string, sectorName: string, district: string): Promise<ResolvedCoordinate | null> {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("q", `${villageText}, ${sectorName}, ${district}, Rwanda`);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "rw");

    const response = await fetch(url.toString(), {
      // Nominatim requires an identifying User-Agent on every request — a
      // generic app identifier, not any user's personal contact info.
      headers: { "User-Agent": "IhigaLite-CropAdvisory/1.0" },
    });

    if (!response.ok) {
      throw new Error(`Nominatim request failed with status ${response.status}`);
    }

    const results = (await response.json()) as NominatimResult[];
    if (results.length === 0) {
      return null;
    }

    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  }
}

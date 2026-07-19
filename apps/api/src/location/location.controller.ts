import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { SectorsService } from "./sectors.service";
import { GeocodingService, ResolvedCoordinate } from "./geocoding.service";
import { Sector } from "./entities/sector.entity";
import { SectorsQueryDto } from "./dto/sectors-query.dto";
import { NearestSectorQueryDto } from "./dto/nearest-sector-query.dto";
import { ResolveVillageDto } from "./dto/resolve-village.dto";

@Controller("location")
export class LocationController {
  constructor(
    private readonly sectorsService: SectorsService,
    private readonly geocodingService: GeocodingService,
  ) {}

  /** Powers the onboarding cascading picker's sector dropdown, and the sidebar's District -> Sector drill-down. */
  @Get("sectors")
  sectors(@Query() query: SectorsQueryDto): Promise<Sector[]> {
    return this.sectorsService.getByDistrict(query.district);
  }

  /** GPS shortcut: reverse-resolves a raw coordinate to the closest seeded sector, for the onboarding picker to auto-fill (and let the farmer review/correct). */
  @Get("nearest-sector")
  nearestSector(@Query() query: NearestSectorQueryDto): Promise<Sector | null> {
    return this.sectorsService.findNearest(query.lat, query.lng);
  }

  /** Free-text village/cell -> coordinate, scoped to the given sector. Returns null (200, not an error) if no confident match. */
  @Post("resolve-village")
  resolveVillage(@Body() body: ResolveVillageDto): Promise<ResolvedCoordinate | null> {
    return this.geocodingService.resolveVillage(body.sectorId, body.villageText);
  }
}

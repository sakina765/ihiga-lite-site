import { Controller, Get, UseGuards } from "@nestjs/common";
import { RWANDA_DISTRICT_COORDINATES } from "./rwanda-districts";
import { districtToProvince } from "./rwanda-provinces";
import { AdminGuard } from "../auth/admin.guard";

export interface AdminDistrictItem {
  district: string;
  /** Undefined only for the "Kigali" whole-city convenience alias in an inconsistent state — shouldn't happen given districtToProvince's explicit handling of it, but typed honestly rather than asserted. */
  province: string | undefined;
  lat: number;
  lon: number;
}

/**
 * Read-only, deliberately — district coordinates live in a hardcoded TS file
 * (RWANDA_DISTRICT_COORDINATES), not a database table, unlike Sector. Making
 * these editable without a redeploy would mean migrating them into the
 * database first (a bigger change, scoped out of this phase — see
 * AdminSectorsController for what IS editable today). This endpoint exists so
 * an admin can at least see what WeatherService actually uses for every
 * district-level forecast lookup.
 */
@Controller("admin/districts")
@UseGuards(AdminGuard)
export class AdminDistrictsController {
  @Get()
  list(): AdminDistrictItem[] {
    return Object.entries(RWANDA_DISTRICT_COORDINATES)
      .map(([district, coords]) => ({
        district,
        province: districtToProvince(district),
        lat: coords.lat,
        lon: coords.lon,
      }))
      .sort((a, b) => (a.province ?? "").localeCompare(b.province ?? "") || a.district.localeCompare(b.district));
  }
}

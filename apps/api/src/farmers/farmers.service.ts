import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Farmer } from "./entities/farmer.entity";
import { normalizePhoneNumber } from "./phone-number.util";
import { SectorsService } from "../location/sectors.service";
import { GeocodingService } from "../location/geocoding.service";
import { ChatLanguage } from "../ai/types";

export interface RegisterOrFindParams {
  phoneNumber: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  /** Sector chosen via the cascading location picker (manually or GPS-auto-filled-then-reviewed). */
  sectorId?: string;
  villageText?: string;
  /** UI language chosen at onboarding (Phase 9). */
  preferredLanguage?: ChatLanguage;
}

interface ResolvedSectorFields {
  sectorId: string;
  /** Derived from the sector row itself — authoritative regardless of whether the caller also passed a district string. */
  district: string | null;
  villageText: string | null;
  resolvedLatitude: number | null;
  resolvedLongitude: number | null;
}

@Injectable()
export class FarmersService {
  constructor(
    @InjectRepository(Farmer) private readonly farmerRepository: Repository<Farmer>,
    private readonly sectorsService: SectorsService,
    private readonly geocodingService: GeocodingService,
  ) {}

  /** Idempotent by phone number — registering the same number twice returns the same Farmer. */
  async registerOrFind(params: RegisterOrFindParams): Promise<Farmer> {
    const normalized = normalizePhoneNumber(params.phoneNumber);
    const existing = await this.farmerRepository.findOne({ where: { phoneNumber: normalized } });

    if (existing) {
      let changed = false;
      // Sector resolution (and any Nominatim call it triggers) only ever runs
      // once per farmer — backfill-only, same as district/GPS below — so a
      // farmer who already completed the picker never re-triggers geocoding.
      // Resolved first so its authoritative sector.district (see below) can
      // still apply even if the plain `district` backfill just below it
      // doesn't fire (e.g. a caller that sends sectorId without district).
      if (params.sectorId && !existing.sectorId) {
        const resolved = await this.resolveSectorFields(params.sectorId, params.villageText);
        Object.assign(existing, resolved);
        changed = true;
      }
      if ((params.district || existing.district) && !existing.district) {
        existing.district = params.district ?? existing.district;
        changed = true;
      }
      // Same backfill-only pattern as district: never overwrite GPS a farmer already shared.
      if (params.latitude !== undefined && params.longitude !== undefined && existing.farmLatitude === null) {
        existing.farmLatitude = params.latitude;
        existing.farmLongitude = params.longitude;
        changed = true;
      }
      // Same backfill-only pattern — a returning farmer who already set a
      // preference keeps it; changing it later goes through
      // updatePreferredLanguage() (the persistent switcher), not re-registration.
      if (params.preferredLanguage && !existing.preferredLanguage) {
        existing.preferredLanguage = params.preferredLanguage;
        changed = true;
      }
      return changed ? this.farmerRepository.save(existing) : existing;
    }

    const resolved = params.sectorId ? await this.resolveSectorFields(params.sectorId, params.villageText) : null;

    const farmer = this.farmerRepository.create({
      phoneNumber: normalized,
      // The sector is the authoritative source of its own district (see
      // Sector entity) once one is chosen — takes precedence over a plain
      // `district` param so /weather/today and crop suggestions (both keyed
      // off farmer.district) work regardless of what the caller also sent.
      district: resolved?.district ?? params.district ?? null,
      farmLatitude: params.latitude ?? null,
      farmLongitude: params.longitude ?? null,
      preferredLanguage: params.preferredLanguage ?? null,
      lastNotifiedStageId: null,
      lastNotifiedWeatherAlertDate: null,
      sectorId: resolved?.sectorId ?? null,
      villageText: resolved?.villageText ?? null,
      resolvedLatitude: resolved?.resolvedLatitude ?? null,
      resolvedLongitude: resolved?.resolvedLongitude ?? null,
    });
    return this.farmerRepository.save(farmer);
  }

  /**
   * Resolves a chosen sector (+ optional free-text village) to a district and
   * final farm coordinate, in precedence order: geocoded village > sector
   * centroid. Raw GPS (farmLatitude/farmLongitude) is a separate,
   * lower-precedence fallback applied by the weather layer when
   * resolvedLatitude/resolvedLongitude are null — see WeatherController.today().
   */
  private async resolveSectorFields(sectorId: string, villageText?: string): Promise<ResolvedSectorFields> {
    const trimmedVillage = villageText?.trim() || undefined;
    const [sector, geocoded] = await Promise.all([
      this.sectorsService.getById(sectorId),
      trimmedVillage ? this.geocodingService.resolveVillage(sectorId, trimmedVillage) : Promise.resolve(null),
    ]);

    return {
      sectorId,
      district: sector?.district ?? null,
      villageText: trimmedVillage ?? null,
      resolvedLatitude: geocoded?.lat ?? sector?.lat ?? null,
      resolvedLongitude: geocoded?.lng ?? sector?.lng ?? null,
    };
  }

  getById(id: string): Promise<Farmer | null> {
    return this.farmerRepository.findOne({ where: { id } });
  }

  /**
   * Deliberately indistinguishable from "farmer exists but hasn't set a
   * preference yet" — both return null. Unlike the chat module's
   * conversationId+farmerId pair, this is a bare id lookup with no companion
   * credential to check ownership against, so the only way to avoid a
   * distinguishable exists-vs-doesn't-exist oracle here is to never
   * surface the difference at all (see the same reasoning applied to
   * updatePreferredLanguage below).
   */
  async getPreferredLanguage(id: string): Promise<ChatLanguage | null> {
    const farmer = await this.farmerRepository.findOne({ where: { id } });
    return farmer?.preferredLanguage ?? null;
  }

  /**
   * Explicit update path for the persistent language switcher — unlike
   * registration's backfill-only pattern, this always overwrites, since the
   * farmer is deliberately changing their preference right now. A
   * nonexistent id is a silent no-op rather than a distinguishable
   * NotFoundException — probing this endpoint with candidate farmerIds
   * learns nothing about which ones are real.
   */
  async updatePreferredLanguage(id: string, preferredLanguage: ChatLanguage): Promise<void> {
    const farmer = await this.farmerRepository.findOne({ where: { id } });
    if (!farmer) {
      return;
    }
    farmer.preferredLanguage = preferredLanguage;
    await this.farmerRepository.save(farmer);
  }

  getAll(): Promise<Farmer[]> {
    return this.farmerRepository.find();
  }

  save(farmer: Farmer): Promise<Farmer> {
    return this.farmerRepository.save(farmer);
  }
}

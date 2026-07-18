import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Farmer } from "./entities/farmer.entity";
import { normalizePhoneNumber } from "./phone-number.util";

@Injectable()
export class FarmersService {
  constructor(@InjectRepository(Farmer) private readonly farmerRepository: Repository<Farmer>) {}

  /** Idempotent by phone number — registering the same number twice returns the same Farmer. */
  async registerOrFind(phoneNumber: string, district?: string, latitude?: number, longitude?: number): Promise<Farmer> {
    const normalized = normalizePhoneNumber(phoneNumber);
    const existing = await this.farmerRepository.findOne({ where: { phoneNumber: normalized } });

    if (existing) {
      let changed = false;
      if (district && !existing.district) {
        existing.district = district;
        changed = true;
      }
      // Same backfill-only pattern as district: never overwrite GPS a farmer already shared.
      if (latitude !== undefined && longitude !== undefined && existing.farmLatitude === null) {
        existing.farmLatitude = latitude;
        existing.farmLongitude = longitude;
        changed = true;
      }
      return changed ? this.farmerRepository.save(existing) : existing;
    }

    const farmer = this.farmerRepository.create({
      phoneNumber: normalized,
      district: district ?? null,
      farmLatitude: latitude ?? null,
      farmLongitude: longitude ?? null,
      preferredLanguage: null,
      lastNotifiedStageId: null,
      lastNotifiedWeatherAlertDate: null,
    });
    return this.farmerRepository.save(farmer);
  }

  getById(id: string): Promise<Farmer | null> {
    return this.farmerRepository.findOne({ where: { id } });
  }

  getAll(): Promise<Farmer[]> {
    return this.farmerRepository.find();
  }

  save(farmer: Farmer): Promise<Farmer> {
    return this.farmerRepository.save(farmer);
  }
}

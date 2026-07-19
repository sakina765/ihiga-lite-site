import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Sector } from "./entities/sector.entity";

@Injectable()
export class SectorsService {
  constructor(@InjectRepository(Sector) private readonly sectorRepository: Repository<Sector>) {}

  getByDistrict(district: string): Promise<Sector[]> {
    return this.sectorRepository.find({ where: { district }, order: { name: "ASC" } });
  }

  getById(id: string): Promise<Sector | null> {
    return this.sectorRepository.findOne({ where: { id } });
  }

  /**
   * Closest seeded sector to a raw GPS coordinate — powers the onboarding GPS
   * shortcut's auto-fill. Plain squared-distance ordering (not true geodesic
   * distance) is a deliberate simplification: Rwanda's entire extent is only
   * ~2.5 degrees across, so the planar approximation never picks the wrong
   * sector in practice, and it lets Postgres do the ranking in one query
   * instead of pulling all 416 rows into memory.
   */
  async findNearest(lat: number, lng: number): Promise<Sector | null> {
    return this.sectorRepository
      .createQueryBuilder("sector")
      .orderBy(`(sector.lat - :lat) * (sector.lat - :lat) + (sector.lng - :lng) * (sector.lng - :lng)`, "ASC")
      .setParameters({ lat, lng })
      .limit(1)
      .getOne();
  }
}

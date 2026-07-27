import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Sector } from "./entities/sector.entity";
import { Farmer } from "../farmers/entities/farmer.entity";
import { AdminCreateSectorDto } from "./dto/admin-create-sector.dto";
import { AdminUpdateSectorDto } from "./dto/admin-update-sector.dto";

@Injectable()
export class SectorsService {
  constructor(
    @InjectRepository(Sector) private readonly sectorRepository: Repository<Sector>,
    // Bare entity registration (see LocationModule) rather than importing
    // FarmersModule — FarmersModule already imports LocationModule, so the
    // reverse would be circular. Only used here for the admin delete-impact
    // count below.
    @InjectRepository(Farmer) private readonly farmerRepository: Repository<Farmer>,
  ) {}

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

  /** Admin list view — optionally scoped to one district (there are ~416 sectors total; a district filter keeps this to a manageable page in practice). */
  adminList(district?: string): Promise<Sector[]> {
    return this.sectorRepository.find({
      where: district ? { district } : {},
      order: { district: "ASC", name: "ASC" },
    });
  }

  create(dto: AdminCreateSectorDto): Promise<Sector> {
    const sector = this.sectorRepository.create({
      district: dto.district,
      name: dto.name,
      nameRw: dto.nameRw ?? null,
      lat: dto.lat,
      lng: dto.lng,
      coordinatesApproximated: dto.coordinatesApproximated ?? true,
    });
    return this.sectorRepository.save(sector);
  }

  async update(id: string, dto: AdminUpdateSectorDto): Promise<Sector> {
    const sector = await this.getByIdOrThrow(id);

    if (dto.district !== undefined) sector.district = dto.district;
    if (dto.name !== undefined) sector.name = dto.name;
    if (dto.nameRw !== undefined) sector.nameRw = dto.nameRw || null;
    if (dto.lat !== undefined) sector.lat = dto.lat;
    if (dto.lng !== undefined) sector.lng = dto.lng;
    if (dto.coordinatesApproximated !== undefined) sector.coordinatesApproximated = dto.coordinatesApproximated;

    return this.sectorRepository.save(sector);
  }

  async delete(id: string): Promise<void> {
    const result = await this.sectorRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`No sector found with id "${id}"`);
    }
  }

  /**
   * Number of farmers currently linked to this sector — there's no enforced
   * FK from Farmer.sectorId to Sector (a bare uuid column, same as
   * Farmer.cropId historically was — see that column's own migration
   * history), so deleting a sector wouldn't fail at the DB level even if
   * farmers reference it. Surfaced to the admin UI before a delete is
   * confirmed anyway, same reasoning as CropsService.getTrackingCount.
   */
  async getTrackingCount(sectorId: string): Promise<number> {
    return this.farmerRepository.count({ where: { sectorId } });
  }

  private async getByIdOrThrow(id: string): Promise<Sector> {
    const sector = await this.sectorRepository.findOne({ where: { id } });
    if (!sector) {
      throw new NotFoundException(`No sector found with id "${id}"`);
    }
    return sector;
  }
}

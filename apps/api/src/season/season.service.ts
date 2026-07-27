import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SeasonBoundaryEntity } from "./entities/season-boundary.entity";
import { DEFAULT_SEASON_BOUNDARIES, SeasonCode } from "./season.constants";
import { resolveSeasonFromBoundaries } from "./season-resolution.util";
import { SeasonInfo } from "./season.types";
import { AdminUpdateSeasonBoundaryDto } from "./dto/admin-update-season-boundary.dto";

@Injectable()
export class SeasonService {
  private readonly logger = new Logger(SeasonService.name);

  constructor(@InjectRepository(SeasonBoundaryEntity) private readonly boundaryRepository: Repository<SeasonBoundaryEntity>) {}

  /** Returns the season for `date`, defaulting to today when omitted. */
  async getCurrentSeason(date: Date = new Date()): Promise<SeasonInfo> {
    return this.getSeasonByDate(date);
  }

  /** Explicit variant of getCurrentSeason — useful for testing against a fixed date. */
  async getSeasonByDate(date: Date): Promise<SeasonInfo> {
    const boundaries = await this.boundaryRepository.find();

    if (boundaries.length === 0) {
      // See CreateSeasonBoundaries migration's doc comment — this should be
      // unreachable in practice (the migration seeds these rows atomically),
      // but season resolution runs on every chat turn with nothing sensible
      // to fall back to in the DB itself, so a coded default is worth having.
      this.logger.warn("season_boundaries table is empty — falling back to DEFAULT_SEASON_BOUNDARIES");
      return resolveSeasonFromBoundaries(date, DEFAULT_SEASON_BOUNDARIES);
    }

    return resolveSeasonFromBoundaries(date, boundaries);
  }

  /** Admin read view — the raw DB rows (month/day boundaries), not the resolved SeasonInfo shape getCurrentSeason returns. */
  adminList(): Promise<SeasonBoundaryEntity[]> {
    return this.boundaryRepository.find({ order: { code: "ASC" } });
  }

  async adminUpdate(code: SeasonCode, dto: AdminUpdateSeasonBoundaryDto): Promise<SeasonBoundaryEntity> {
    const boundary = await this.boundaryRepository.findOne({ where: { code } });
    if (!boundary) {
      throw new NotFoundException(`No season boundary found for code "${code}"`);
    }

    if (dto.localName !== undefined) {
      boundary.localName = dto.localName;
    }
    if (dto.englishName !== undefined) {
      boundary.englishName = dto.englishName;
    }
    if (dto.startMonth !== undefined) {
      boundary.startMonth = dto.startMonth;
    }
    if (dto.startDay !== undefined) {
      boundary.startDay = dto.startDay;
    }
    if (dto.endMonth !== undefined) {
      boundary.endMonth = dto.endMonth;
    }
    if (dto.endDay !== undefined) {
      boundary.endDay = dto.endDay;
    }

    return this.boundaryRepository.save(boundary);
  }
}

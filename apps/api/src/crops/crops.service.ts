import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Crop } from "./entities/crop.entity";
import { CropStage } from "./entities/crop-stage.entity";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

@Injectable()
export class CropsService {
  constructor(
    @InjectRepository(Crop) private readonly cropRepository: Repository<Crop>,
    @InjectRepository(CropStage) private readonly cropStageRepository: Repository<CropStage>,
  ) {}

  getAllCrops(): Promise<Crop[]> {
    return this.cropRepository.find({ order: { name: "ASC" } });
  }

  async getCropBySlug(slug: string): Promise<Crop> {
    const crop = await this.cropRepository.findOne({ where: { slug }, relations: ["stages"] });
    if (!crop) {
      throw new NotFoundException(`No crop found with slug "${slug}"`);
    }
    crop.stages = [...crop.stages].sort((a, b) => a.orderIndex - b.orderIndex);
    return crop;
  }

  /**
   * Returns the stage a farmer is currently in, given when they planted.
   * `referenceDate` defaults to today and exists mainly so callers (and tests)
   * can pin "now" to a fixed point in time.
   */
  async getCurrentStage(cropId: string, plantingDate: Date, referenceDate: Date = new Date()): Promise<CropStage> {
    const crop = await this.cropRepository.findOne({ where: { id: cropId }, relations: ["stages"] });
    if (!crop) {
      throw new NotFoundException(`No crop found with id "${cropId}"`);
    }
    if (crop.stages.length === 0) {
      throw new NotFoundException(`Crop "${crop.slug}" has no stages configured`);
    }

    const stages = [...crop.stages].sort((a, b) => a.orderIndex - b.orderIndex);

    const weeksSincePlanting = Math.max(
      0,
      Math.floor((startOfDay(referenceDate).getTime() - startOfDay(plantingDate).getTime()) / MS_PER_WEEK),
    );

    const currentStage = stages.find((s) => weeksSincePlanting >= s.weekStart && weeksSincePlanting <= s.weekEnd);
    if (currentStage) {
      return currentStage;
    }

    // Past the last stage's week range: treat as harvest-complete and return the final stage.
    return stages[stages.length - 1];
  }
}

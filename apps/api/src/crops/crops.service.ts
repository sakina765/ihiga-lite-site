import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Crop } from "./entities/crop.entity";
import { CropStage } from "./entities/crop-stage.entity";
import { Conversation } from "../chat/entities/conversation.entity";
import { AdminCreateCropDto } from "./dto/admin-create-crop.dto";
import { AdminUpdateCropDto } from "./dto/admin-update-crop.dto";
import { CropStageInputDto } from "./dto/admin-replace-crop-stages.dto";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

@Injectable()
export class CropsService {
  constructor(
    @InjectRepository(Crop) private readonly cropRepository: Repository<Crop>,
    @InjectRepository(CropStage) private readonly cropStageRepository: Repository<CropStage>,
    @InjectRepository(Conversation) private readonly conversationRepository: Repository<Conversation>,
  ) {}

  getAllCrops(): Promise<Crop[]> {
    return this.cropRepository.find({ order: { name: "ASC" } });
  }

  /** Admin list view — same rows as getAllCrops, but with stages eagerly loaded and sorted, for the admin crop/stage editor. */
  async adminList(): Promise<Crop[]> {
    const crops = await this.cropRepository.find({ order: { name: "ASC" }, relations: ["stages"] });
    for (const crop of crops) {
      crop.stages = [...crop.stages].sort((a, b) => a.orderIndex - b.orderIndex);
    }
    return crops;
  }

  private async getByIdOrThrow(id: string): Promise<Crop> {
    const crop = await this.cropRepository.findOne({ where: { id } });
    if (!crop) {
      throw new NotFoundException(`No crop found with id "${id}"`);
    }
    return crop;
  }

  private async assertSlugAvailable(slug: string, excludingCropId?: string): Promise<void> {
    const existing = await this.cropRepository.findOne({ where: { slug } });
    if (existing && existing.id !== excludingCropId) {
      throw new ConflictException(`A crop with slug "${slug}" already exists`);
    }
  }

  async create(dto: AdminCreateCropDto): Promise<Crop> {
    await this.assertSlugAvailable(dto.slug);
    const crop = this.cropRepository.create({
      name: dto.name,
      localName: dto.localName,
      slug: dto.slug,
      description: dto.description ?? null,
    });
    return this.cropRepository.save(crop);
  }

  async update(id: string, dto: AdminUpdateCropDto): Promise<Crop> {
    const crop = await this.getByIdOrThrow(id);

    if (dto.slug !== undefined && dto.slug !== crop.slug) {
      await this.assertSlugAvailable(dto.slug, id);
      crop.slug = dto.slug;
    }
    if (dto.name !== undefined) {
      crop.name = dto.name;
    }
    if (dto.localName !== undefined) {
      crop.localName = dto.localName;
    }
    if (dto.description !== undefined) {
      crop.description = dto.description || null;
    }

    return this.cropRepository.save(crop);
  }

  /**
   * Number of conversations currently tracking this crop (i.e. a real farmer
   * would be affected) — surfaced by the admin UI before a delete is
   * confirmed, so "delete this crop" isn't a blind action against live
   * farmer data.
   */
  async getTrackingCount(cropId: string): Promise<number> {
    return this.conversationRepository.count({ where: { cropId } });
  }

  async delete(id: string): Promise<void> {
    const result = await this.cropRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`No crop found with id "${id}"`);
    }
  }

  /** See AdminReplaceCropStagesDto's doc comment for why this replaces the whole list rather than exposing per-stage CRUD. */
  async replaceStages(cropId: string, stages: CropStageInputDto[]): Promise<CropStage[]> {
    await this.getByIdOrThrow(cropId);

    for (const stage of stages) {
      if (stage.weekStart > stage.weekEnd) {
        throw new BadRequestException(`Stage "${stage.name}": weekStart (${stage.weekStart}) can't be after weekEnd (${stage.weekEnd})`);
      }
    }

    await this.cropStageRepository.delete({ cropId });
    const created = stages.map((stage, index) =>
      this.cropStageRepository.create({
        cropId,
        name: stage.name,
        orderIndex: index,
        weekStart: stage.weekStart,
        weekEnd: stage.weekEnd,
        taskDescription: stage.taskDescription,
        taskDescriptionRw: stage.taskDescriptionRw,
      }),
    );
    return this.cropStageRepository.save(created);
  }

  /** Existence check only — used by admin-facing writes elsewhere (e.g. KnowledgeService) to give a clear 400 instead of a raw FK-violation 500 for a bogus cropId. */
  async existsById(id: string): Promise<boolean> {
    const count = await this.cropRepository.count({ where: { id } });
    return count > 0;
  }

  /** Plain lookup, no throw — used where a missing crop is a normal, silently-tolerated outcome (e.g. resolving a conversation's cropId for display). */
  getById(id: string): Promise<Crop | null> {
    return this.cropRepository.findOne({ where: { id } });
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

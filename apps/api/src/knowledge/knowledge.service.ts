import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { KnowledgeFact } from "./entities/knowledge-fact.entity";
import { CropsService } from "../crops/crops.service";
import { CreateKnowledgeFactDto } from "./dto/create-knowledge-fact.dto";
import { UpdateKnowledgeFactDto } from "./dto/update-knowledge-fact.dto";

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(KnowledgeFact) private readonly knowledgeFactRepository: Repository<KnowledgeFact>,
    private readonly cropsService: CropsService,
  ) {}

  /**
   * Simple ILIKE-based keyword search over fact_text and tags.
   * TODO: upgrade to embedding-based semantic search once result quality/scale requires it.
   */
  search(query: string, cropId?: string, topic?: string): Promise<KnowledgeFact[]> {
    const qb = this.knowledgeFactRepository.createQueryBuilder("fact");

    if (query) {
      qb.andWhere("(fact.factText ILIKE :q OR array_to_string(fact.tags, ',') ILIKE :q)", { q: `%${query}%` });
    }
    if (cropId) {
      qb.andWhere("fact.cropId = :cropId", { cropId });
    }
    if (topic) {
      qb.andWhere("fact.topic = :topic", { topic });
    }

    return qb.getMany();
  }

  /** Batch lookup by id — used by the admin conversation viewer (Phase 5) to resolve a bot message's retrievedFactIds into displayable fact summaries. Order is not guaranteed to match `ids`. */
  getByIds(ids: string[]): Promise<KnowledgeFact[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.knowledgeFactRepository.find({ where: { id: In(ids) } });
  }

  /** Admin list view — unlike search(), no query text; filters are exact-match, and the crop relation is loaded so the UI can show a crop name without an extra round trip. */
  adminList(filter: { cropId?: string; topic?: string; reviewed?: boolean }): Promise<KnowledgeFact[]> {
    const qb = this.knowledgeFactRepository.createQueryBuilder("fact").leftJoinAndSelect("fact.crop", "crop");

    if (filter.cropId) {
      qb.andWhere("fact.cropId = :cropId", { cropId: filter.cropId });
    }
    if (filter.topic) {
      qb.andWhere("fact.topic = :topic", { topic: filter.topic });
    }
    if (filter.reviewed !== undefined) {
      qb.andWhere("fact.reviewed = :reviewed", { reviewed: filter.reviewed });
    }

    return qb.orderBy("fact.topic", "ASC").addOrderBy("fact.id", "ASC").getMany();
  }

  async create(dto: CreateKnowledgeFactDto): Promise<KnowledgeFact> {
    if (dto.cropId) {
      await this.assertCropExists(dto.cropId);
    }

    const fact = this.knowledgeFactRepository.create({
      cropId: dto.cropId ?? null,
      topic: dto.topic,
      factText: dto.factText,
      factTextRw: dto.factTextRw ?? null,
      source: dto.source,
      tags: dto.tags ?? [],
      reviewed: false,
      reviewedAt: null,
    });
    return this.knowledgeFactRepository.save(fact);
  }

  async update(id: string, dto: UpdateKnowledgeFactDto): Promise<KnowledgeFact> {
    const fact = await this.getByIdOrThrow(id);
    let contentChanged = false;

    if ("cropId" in dto) {
      if (dto.cropId) {
        await this.assertCropExists(dto.cropId);
      }
      fact.cropId = dto.cropId ?? null;
    }
    if (dto.topic !== undefined) {
      fact.topic = dto.topic;
      contentChanged = true;
    }
    if (dto.factText !== undefined) {
      fact.factText = dto.factText;
      contentChanged = true;
    }
    if ("factTextRw" in dto) {
      fact.factTextRw = dto.factTextRw ?? null;
      contentChanged = true;
    }
    if (dto.source !== undefined) {
      fact.source = dto.source;
      contentChanged = true;
    }
    if (dto.tags !== undefined) {
      fact.tags = dto.tags;
    }

    // Editing what a fact actually claims (topic/text/source) means the
    // PREVIOUS review no longer vouches for the NEW content — silently
    // keeping "reviewed" set here would let unchecked content wear a
    // validated badge. Re-review is a deliberate, separate action.
    if (contentChanged) {
      fact.reviewed = false;
      fact.reviewedAt = null;
    }

    return this.knowledgeFactRepository.save(fact);
  }

  async delete(id: string): Promise<void> {
    const result = await this.knowledgeFactRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`No knowledge fact found with id "${id}"`);
    }
  }

  async markReviewed(id: string): Promise<KnowledgeFact> {
    const fact = await this.getByIdOrThrow(id);
    fact.reviewed = true;
    fact.reviewedAt = new Date();
    return this.knowledgeFactRepository.save(fact);
  }

  private async getByIdOrThrow(id: string): Promise<KnowledgeFact> {
    const fact = await this.knowledgeFactRepository.findOne({ where: { id } });
    if (!fact) {
      throw new NotFoundException(`No knowledge fact found with id "${id}"`);
    }
    return fact;
  }

  private async assertCropExists(cropId: string): Promise<void> {
    const exists = await this.cropsService.existsById(cropId);
    if (!exists) {
      throw new BadRequestException(`No crop found with id "${cropId}"`);
    }
  }
}

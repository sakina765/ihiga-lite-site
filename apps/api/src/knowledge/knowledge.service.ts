import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { KnowledgeFact } from "./entities/knowledge-fact.entity";

@Injectable()
export class KnowledgeService {
  constructor(@InjectRepository(KnowledgeFact) private readonly knowledgeFactRepository: Repository<KnowledgeFact>) {}

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
}

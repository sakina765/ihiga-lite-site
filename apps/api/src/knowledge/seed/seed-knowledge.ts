import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppModule } from "../../app.module";
import { Crop } from "../../crops/entities/crop.entity";
import { KnowledgeFact } from "../entities/knowledge-fact.entity";
import { KNOWLEDGE_FACT_SEEDS } from "./knowledge.seed-data";

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });

  try {
    const cropRepository = app.get<Repository<Crop>>(getRepositoryToken(Crop));
    const knowledgeFactRepository = app.get<Repository<KnowledgeFact>>(getRepositoryToken(KnowledgeFact));

    const crops = await cropRepository.find();
    const cropIdBySlug = new Map(crops.map((crop) => [crop.slug, crop.id]));

    // Placeholder seed data — wipe and reinsert wholesale rather than diffing.
    await knowledgeFactRepository.clear();

    const facts = KNOWLEDGE_FACT_SEEDS.map((seed) => {
      const cropId = seed.cropSlug ? cropIdBySlug.get(seed.cropSlug) ?? null : null;
      if (seed.cropSlug && !cropId) {
        console.warn(`No crop found for slug "${seed.cropSlug}" — seeding fact as crop-agnostic instead.`);
      }
      return knowledgeFactRepository.create({
        cropId,
        topic: seed.topic,
        factText: seed.factText,
        factTextRw: seed.factTextRw,
        source: seed.source,
        tags: seed.tags,
      });
    });

    await knowledgeFactRepository.save(facts);
    console.log(`Seeded ${facts.length} knowledge facts`);
  } finally {
    await app.close();
  }
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding knowledge facts failed:", error);
    process.exit(1);
  });

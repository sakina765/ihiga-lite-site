import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppModule } from "../../app.module";
import { Crop } from "../entities/crop.entity";
import { CropStage } from "../entities/crop-stage.entity";
import { CROP_SEEDS } from "./crops.seed-data";

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });

  try {
    const cropRepository = app.get<Repository<Crop>>(getRepositoryToken(Crop));
    const cropStageRepository = app.get<Repository<CropStage>>(getRepositoryToken(CropStage));

    for (const seed of CROP_SEEDS) {
      let crop = await cropRepository.findOne({ where: { slug: seed.slug } });
      if (!crop) {
        crop = cropRepository.create({
          name: seed.name,
          localName: seed.localName,
          slug: seed.slug,
          description: seed.description,
        });
      } else {
        crop.name = seed.name;
        crop.localName = seed.localName;
        crop.description = seed.description;
      }
      crop = await cropRepository.save(crop);

      // Replace this crop's stages wholesale — simplest way to keep the seed idempotent.
      await cropStageRepository.delete({ cropId: crop.id });
      const stages = CROP_SEEDS.find((s) => s.slug === seed.slug)!.stages.map((stage) =>
        cropStageRepository.create({ ...stage, cropId: crop!.id }),
      );
      await cropStageRepository.save(stages);

      console.log(`Seeded crop "${seed.name}" (${seed.slug}) with ${stages.length} stages`);
    }
  } finally {
    await app.close();
  }
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding crops failed:", error);
    process.exit(1);
  });

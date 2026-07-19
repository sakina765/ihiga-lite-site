import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppModule } from "../../app.module";
import { Sector } from "../entities/sector.entity";
import { RWANDA_SECTORS_BY_DISTRICT } from "./rwanda-sectors.data";
import { RWANDA_DISTRICT_COORDINATES } from "../../weather/rwanda-districts";

const RADIUS_DEGREES = 0.05; // ≈5.5km — a reasonable within-district spread for Rwanda's compact districts.

/**
 * Approximates a sector's coordinate as an offset from its district's known
 * centroid, spread evenly around a small ring by index — NOT a real sector
 * position. Deliberately deterministic (no Math.random()) so re-running the
 * seed produces identical coordinates every time, and NOT a guess at any
 * individual sector's true location. Every row seeded this way is flagged
 * coordinatesApproximated=true (see sector.entity.ts) rather than presented
 * as verified data.
 */
export function approximateCoordinate(centroid: { lat: number; lon: number }, index: number, total: number): { lat: number; lng: number } {
  const angle = (2 * Math.PI * index) / total;
  return {
    lat: centroid.lat + RADIUS_DEGREES * Math.cos(angle),
    lng: centroid.lon + RADIUS_DEGREES * Math.sin(angle),
  };
}

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });

  try {
    const sectorRepository = app.get<Repository<Sector>>(getRepositoryToken(Sector));
    let seededCount = 0;

    for (const [district, sectorNames] of Object.entries(RWANDA_SECTORS_BY_DISTRICT)) {
      const centroid = RWANDA_DISTRICT_COORDINATES[district];
      if (!centroid) {
        console.warn(`Skipping district "${district}" — no centroid in RWANDA_DISTRICT_COORDINATES`);
        continue;
      }

      for (let i = 0; i < sectorNames.length; i++) {
        const name = sectorNames[i];
        const { lat, lng } = approximateCoordinate(centroid, i, sectorNames.length);

        let sector = await sectorRepository.findOne({ where: { district, name } });
        if (!sector) {
          sector = sectorRepository.create({ district, name, nameRw: null, lat, lng, coordinatesApproximated: true });
        } else {
          sector.lat = lat;
          sector.lng = lng;
          sector.coordinatesApproximated = true;
        }
        await sectorRepository.save(sector);
        seededCount++;
      }
    }

    console.log(`Seeded ${seededCount} sectors across ${Object.keys(RWANDA_SECTORS_BY_DISTRICT).length} districts (all coordinatesApproximated=true).`);
  } finally {
    await app.close();
  }
}

// Guarded so importing this module (e.g. to unit-test approximateCoordinate)
// never triggers a real NestJS app bootstrap — only running it directly (as
// the pnpm seed:sectors script does) does.
if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seeding sectors failed:", error);
      process.exit(1);
    });
}

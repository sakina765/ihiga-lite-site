import "reflect-metadata";
import { getMetadataArgsStorage } from "typeorm";
import { approximateCoordinate } from "./seed-sectors";
import { RWANDA_SECTORS_BY_DISTRICT } from "./rwanda-sectors.data";
import { RWANDA_DISTRICT_COORDINATES } from "../../weather/rwanda-districts";
import { Sector } from "../entities/sector.entity";

describe("approximateCoordinate", () => {
  const centroid = { lat: -1.9441, lon: 30.0619 };

  it("is deterministic — the same (centroid, index, total) always produces the same coordinate", () => {
    const first = approximateCoordinate(centroid, 3, 15);
    const second = approximateCoordinate(centroid, 3, 15);

    expect(first).toEqual(second);
  });

  it("stays within a small offset of the district centroid, never drifting into another district", () => {
    const { lat, lng } = approximateCoordinate(centroid, 0, 15);

    // RADIUS_DEGREES is 0.05 (~5.5km) — allow a small margin for floating point.
    expect(Math.abs(lat - centroid.lat)).toBeLessThanOrEqual(0.0501);
    expect(Math.abs(lng - centroid.lon)).toBeLessThanOrEqual(0.0501);
  });

  it("spreads sectors around the centroid rather than collapsing them to one point", () => {
    const a = approximateCoordinate(centroid, 0, 4);
    const b = approximateCoordinate(centroid, 1, 4);
    const c = approximateCoordinate(centroid, 2, 4);

    expect(a).not.toEqual(b);
    expect(b).not.toEqual(c);
  });
});

describe("RWANDA_SECTORS_BY_DISTRICT data integrity", () => {
  it("has a known centroid for every district it lists sectors for, so none are silently skipped at seed time", () => {
    const missing = Object.keys(RWANDA_SECTORS_BY_DISTRICT).filter((district) => !RWANDA_DISTRICT_COORDINATES[district]);

    expect(missing).toEqual([]);
  });

  it("covers all 30 official districts", () => {
    expect(Object.keys(RWANDA_SECTORS_BY_DISTRICT)).toHaveLength(30);
  });

  it("seeds Rwanda's real total of 416 sectors", () => {
    const total = Object.values(RWANDA_SECTORS_BY_DISTRICT).reduce((sum, sectors) => sum + sectors.length, 0);
    expect(total).toBe(416);
  });
});

describe("Sector entity — coordinatesApproximated is a real, queryable column, not just a code comment", () => {
  it("defaults to true, so a seeded (approximated) row is distinguishable from a future verified import that explicitly sets it false", () => {
    const columns = getMetadataArgsStorage().columns.filter((c) => c.target === Sector);
    const flagColumn = columns.find((c) => c.propertyName === "coordinatesApproximated");

    expect(flagColumn).toBeDefined();
    expect(flagColumn?.options.default).toBe(true);
  });
});

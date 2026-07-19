import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

/**
 * Permanent cache of Nominatim village lookups, keyed by (sectorId,
 * villageText) — shared across ALL farmers, not per-farmer. This is what
 * actually makes "never re-geocode the same village text twice" meaningful:
 * if two different farmers in the same sector type the same village name,
 * the second one is served from this table, never re-hits Nominatim.
 *
 * A row with found=false / null coordinates is still a permanent cache hit
 * (Nominatim was asked and had no confident match) — we don't retry a
 * previously-unresolved village on every subsequent registration either.
 */
@Entity("village_geocode_cache")
@Unique(["sectorId", "villageText"])
export class VillageGeocodeCache {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "sector_id", type: "uuid" })
  sectorId: string;

  // Normalized (trimmed + lowercased) by GeocodingService before every read/write here.
  @Column({ name: "village_text" })
  villageText: string;

  @Column()
  found: boolean;

  @Column({ name: "resolved_latitude", type: "double precision", nullable: true })
  resolvedLatitude: number | null;

  @Column({ name: "resolved_longitude", type: "double precision", nullable: true })
  resolvedLongitude: number | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}

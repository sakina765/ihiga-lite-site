import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("sectors")
export class Sector {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // Plain string, not a District FK — this codebase has never modeled
  // district as its own table (see Farmer.district, RWANDA_DISTRICT_COORDINATES,
  // RWANDA_PROVINCE_DISTRICTS — all treat district as a well-known string,
  // not a relation). Matches those same district name strings exactly.
  @Column()
  district: string;

  @Column()
  name: string;

  // Rwandan sector names are already Kinyarwanda place names (e.g.
  // "Kimisagara", "Nyamirambo") — there's no separate English translation to
  // store here, unlike Crop.name/localName. Left null rather than duplicating
  // `name` into a fake "translation".
  @Column({ name: "name_rw", type: "varchar", nullable: true })
  nameRw: string | null;

  @Column({ type: "double precision" })
  lat: number;

  @Column({ type: "double precision" })
  lng: number;

  /**
   * true = seed-time approximation (offset from the district centroid, see
   * seed-sectors.ts), not a verified sector coordinate. Kept as a real column
   * (not just a code comment) so a future import of real sector coordinates
   * can flip this to false per-row and the two are always distinguishable in
   * the data itself, not just in seed-script source.
   */
  @Column({ name: "coordinates_approximated", default: true })
  coordinatesApproximated: boolean;
}

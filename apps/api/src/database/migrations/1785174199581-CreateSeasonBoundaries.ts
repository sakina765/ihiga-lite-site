import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Deliberately seeds data directly in a migration — a deviation from this
 * project's usual "seed data is separate from migrations" rule (see
 * DEPLOYMENT.md / pnpm seed). That rule holds for crops/knowledge/sectors
 * because every caller of those already degrades gracefully when the table
 * is empty. SeasonService has no such fallback path in the database itself:
 * it computes the current season on every single chat turn and has nothing
 * sensible to return without at least one matching boundary row. Rather than
 * leave a real window (after this migration runs, before an admin remembers
 * to run a separate seed step) where every chat message fails, the 3 rows
 * are inserted here, atomically, in the same transaction as the table
 * itself. (SeasonService also keeps a hardcoded fallback constant as a
 * second line of defense — see DEFAULT_SEASON_BOUNDARIES in
 * season.constants.ts — for the same reason.)
 */
export class CreateSeasonBoundaries1785174199581 implements MigrationInterface {
    name = 'CreateSeasonBoundaries1785174199581'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "season_boundaries" (
                "code" character varying(1) NOT NULL,
                "local_name" character varying NOT NULL,
                "english_name" character varying NOT NULL,
                "start_month" integer NOT NULL,
                "start_day" integer NOT NULL,
                "end_month" integer NOT NULL,
                "end_day" integer NOT NULL,
                CONSTRAINT "PK_season_boundaries_code" PRIMARY KEY ("code")
            )
        `);

        await queryRunner.query(`
            INSERT INTO "season_boundaries" ("code", "local_name", "english_name", "start_month", "start_day", "end_month", "end_day")
            VALUES
                ('A', 'Urugaryi', 'Season A (main rainy season)', 9, 15, 2, 14),
                ('B', 'Itumba', 'Season B (second rainy season)', 2, 15, 6, 15),
                ('C', 'Impeshyi', 'Season C (dry season / irrigated & marshland farming)', 6, 16, 9, 14)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "season_boundaries"`);
    }

}

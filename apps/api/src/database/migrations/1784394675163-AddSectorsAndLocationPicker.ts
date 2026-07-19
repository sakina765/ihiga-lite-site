import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSectorsAndLocationPicker1784394675163 implements MigrationInterface {
    name = 'AddSectorsAndLocationPicker1784394675163'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "village_geocode_cache" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sector_id" uuid NOT NULL, "village_text" character varying NOT NULL, "found" boolean NOT NULL, "resolved_latitude" double precision, "resolved_longitude" double precision, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0dc4ec72575c6461b2bac247af6" UNIQUE ("sector_id", "village_text"), CONSTRAINT "PK_027302eb50a0fde17a38bef73a3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sectors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "district" character varying NOT NULL, "name" character varying NOT NULL, "name_rw" character varying, "lat" double precision NOT NULL, "lng" double precision NOT NULL, "coordinates_approximated" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_923fdda0dc12f59add7b3a1782f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "farmers" ADD "sector_id" uuid`);
        await queryRunner.query(`ALTER TABLE "farmers" ADD "village_text" character varying`);
        await queryRunner.query(`ALTER TABLE "farmers" ADD "resolved_latitude" double precision`);
        await queryRunner.query(`ALTER TABLE "farmers" ADD "resolved_longitude" double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "farmers" DROP COLUMN "resolved_longitude"`);
        await queryRunner.query(`ALTER TABLE "farmers" DROP COLUMN "resolved_latitude"`);
        await queryRunner.query(`ALTER TABLE "farmers" DROP COLUMN "village_text"`);
        await queryRunner.query(`ALTER TABLE "farmers" DROP COLUMN "sector_id"`);
        await queryRunner.query(`DROP TABLE "sectors"`);
        await queryRunner.query(`DROP TABLE "village_geocode_cache"`);
    }

}

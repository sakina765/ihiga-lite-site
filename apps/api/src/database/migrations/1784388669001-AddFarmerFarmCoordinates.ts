import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFarmerFarmCoordinates1784388669001 implements MigrationInterface {
    name = 'AddFarmerFarmCoordinates1784388669001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "farmers" ADD "farm_latitude" double precision`);
        await queryRunner.query(`ALTER TABLE "farmers" ADD "farm_longitude" double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "farmers" DROP COLUMN "farm_longitude"`);
        await queryRunner.query(`ALTER TABLE "farmers" DROP COLUMN "farm_latitude"`);
    }

}

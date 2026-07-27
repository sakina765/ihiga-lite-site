import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoleAndPasswordHashToFarmer1785163774056 implements MigrationInterface {
    name = 'AddRoleAndPasswordHashToFarmer1785163774056'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "farmers" ADD "role" character varying(10) NOT NULL DEFAULT 'farmer'`);
        await queryRunner.query(`ALTER TABLE "farmers" ADD "password_hash" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "farmers" DROP COLUMN "password_hash"`);
        await queryRunner.query(`ALTER TABLE "farmers" DROP COLUMN "role"`);
    }

}

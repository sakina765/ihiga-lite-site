import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeactivatedAtToFarmer1785175648127 implements MigrationInterface {
    name = 'AddDeactivatedAtToFarmer1785175648127'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "farmers" ADD "deactivated_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "farmers" DROP COLUMN "deactivated_at"`);
    }

}

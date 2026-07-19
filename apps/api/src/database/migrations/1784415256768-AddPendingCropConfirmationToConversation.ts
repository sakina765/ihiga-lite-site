import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPendingCropConfirmationToConversation1784415256768 implements MigrationInterface {
    name = 'AddPendingCropConfirmationToConversation1784415256768'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" ADD "pending_crop_slug" character varying`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "pending_planting_date" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "pending_planting_date"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "pending_crop_slug"`);
    }

}

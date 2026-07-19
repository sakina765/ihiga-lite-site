import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCropTrackingDeclinedToConversation1784416308141 implements MigrationInterface {
    name = 'AddCropTrackingDeclinedToConversation1784416308141'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" ADD "crop_tracking_declined" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "crop_tracking_declined"`);
    }

}

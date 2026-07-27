import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReviewedToKnowledgeFact1785168113814 implements MigrationInterface {
    name = 'AddReviewedToKnowledgeFact1785168113814'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "knowledge_facts" ADD "reviewed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "knowledge_facts" ADD "reviewed_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "knowledge_facts" DROP COLUMN "reviewed_at"`);
        await queryRunner.query(`ALTER TABLE "knowledge_facts" DROP COLUMN "reviewed"`);
    }

}

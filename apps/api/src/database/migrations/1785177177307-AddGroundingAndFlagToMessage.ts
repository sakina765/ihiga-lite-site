import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGroundingAndFlagToMessage1785177177307 implements MigrationInterface {
    name = 'AddGroundingAndFlagToMessage1785177177307'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Nullable, no default — only ever populated for a NEW bot reply going
        // forward (see ChatOrchestratorService.persistBotReply). Existing rows
        // stay null, meaning "not recorded for this reply" (this data was never
        // captured before), distinct from an empty array meaning "recorded, and
        // zero facts were retrieved".
        await queryRunner.query(`ALTER TABLE "messages" ADD "retrieved_fact_ids" uuid array`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "flagged" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "flagged_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "flagged_at"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "flagged"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "retrieved_fact_ids"`);
    }

}

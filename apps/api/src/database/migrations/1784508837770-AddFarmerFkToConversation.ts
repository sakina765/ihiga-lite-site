import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFarmerFkToConversation1784508837770 implements MigrationInterface {
    name = 'AddFarmerFkToConversation1784508837770'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_99e4a91a9b2cb86960532a0d07f" FOREIGN KEY ("farmer_id") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_99e4a91a9b2cb86960532a0d07f"`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1784315328227 implements MigrationInterface {
    name = 'InitialSchema1784315328227'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Required for uuid_generate_v4() below. Already enabled by default on
        // Supabase and on this project's Docker Postgres image; IF NOT EXISTS
        // makes this a no-op there. Needed for a bare/self-hosted Postgres.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "crop_stages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "crop_id" uuid NOT NULL, "name" character varying NOT NULL, "order_index" integer NOT NULL, "week_start" integer NOT NULL, "week_end" integer NOT NULL, "task_description" text NOT NULL, "task_description_rw" text NOT NULL, CONSTRAINT "PK_83d5e652bab8b099952622ee99d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "crops" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "local_name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, CONSTRAINT "UQ_944136fc2f96bbc5b2ff8197ed6" UNIQUE ("slug"), CONSTRAINT "PK_098dbeb7c803dc7c08a7f02b805" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "knowledge_facts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "crop_id" uuid, "topic" character varying NOT NULL, "fact_text" text NOT NULL, "fact_text_rw" text, "source" character varying NOT NULL, "tags" text array NOT NULL DEFAULT '{}', CONSTRAINT "PK_db0c1c1918e70963cf59b7e4146" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "farmers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone_number" character varying NOT NULL, "district" character varying, "preferred_language" character varying(2), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "last_notified_stage_id" uuid, "last_notified_weather_alert_date" date, CONSTRAINT "UQ_0172a26c404f8d3aab3be8c8735" UNIQUE ("phone_number"), CONSTRAINT "PK_ccbe91e5e64dde1329b4c153637" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "language" character varying(2), "farmer_id" uuid, "crop_id" uuid, "planting_date" date, CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "role" character varying(4) NOT NULL, "type" character varying(5) NOT NULL DEFAULT 'text', "text" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "crop_stages" ADD CONSTRAINT "FK_2f3b408c07e29cbf2b473076511" FOREIGN KEY ("crop_id") REFERENCES "crops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "knowledge_facts" ADD CONSTRAINT "FK_d669c1d293b75b9466a35e177d6" FOREIGN KEY ("crop_id") REFERENCES "crops"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23"`);
        await queryRunner.query(`ALTER TABLE "knowledge_facts" DROP CONSTRAINT "FK_d669c1d293b75b9466a35e177d6"`);
        await queryRunner.query(`ALTER TABLE "crop_stages" DROP CONSTRAINT "FK_2f3b408c07e29cbf2b473076511"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`DROP TABLE "farmers"`);
        await queryRunner.query(`DROP TABLE "knowledge_facts"`);
        await queryRunner.query(`DROP TABLE "crops"`);
        await queryRunner.query(`DROP TABLE "crop_stages"`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationLogs1785178223650 implements MigrationInterface {
    name = 'CreateNotificationLogs1785178223650'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "notification_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "farmer_id" uuid NOT NULL,
                "stage_changed" boolean NOT NULL,
                "weather_risk" boolean NOT NULL,
                "message" text NOT NULL,
                "outcome" character varying(20) NOT NULL,
                "provider_status" character varying,
                "provider_status_code" integer,
                "provider_cost" character varying,
                "provider_message_id" character varying,
                "error_message" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_notification_logs_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "notification_logs"
            ADD CONSTRAINT "FK_notification_logs_farmer_id"
            FOREIGN KEY ("farmer_id") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "notification_logs"`);
    }

}

import { Controller, Get } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import type { HealthCheckResponse } from "@ihiga-lite/shared";

@Controller("health")
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  check(): HealthCheckResponse {
    return {
      status: "ok",
      db: this.dataSource.isInitialized,
    };
  }
}

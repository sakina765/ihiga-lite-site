import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SeasonBoundaryEntity } from "./entities/season-boundary.entity";
import { SeasonService } from "./season.service";
import { AdminSeasonController } from "./admin-season.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([SeasonBoundaryEntity]), AuthModule],
  providers: [SeasonService],
  controllers: [AdminSeasonController],
  exports: [SeasonService],
})
export class SeasonModule {}

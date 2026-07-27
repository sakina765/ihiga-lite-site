import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { KnowledgeFact } from "./entities/knowledge-fact.entity";
import { KnowledgeService } from "./knowledge.service";
import { AdminKnowledgeController } from "./admin-knowledge.controller";
import { CropsModule } from "../crops/crops.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  // CropsModule (for cropId existence checks on admin writes) and AuthModule
  // (for AdminGuard) — neither imports KnowledgeModule back, so no cycle.
  imports: [TypeOrmModule.forFeature([KnowledgeFact]), CropsModule, AuthModule],
  providers: [KnowledgeService],
  controllers: [AdminKnowledgeController],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}

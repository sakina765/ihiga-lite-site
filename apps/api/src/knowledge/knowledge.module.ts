import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { KnowledgeFact } from "./entities/knowledge-fact.entity";
import { KnowledgeService } from "./knowledge.service";

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeFact])],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}

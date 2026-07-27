import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { KnowledgeService } from "./knowledge.service";
import { KnowledgeFact } from "./entities/knowledge-fact.entity";
import { CreateKnowledgeFactDto } from "./dto/create-knowledge-fact.dto";
import { UpdateKnowledgeFactDto } from "./dto/update-knowledge-fact.dto";
import { AdminKnowledgeQueryDto } from "./dto/admin-knowledge-query.dto";
import { AdminGuard } from "../auth/admin.guard";

@Controller("admin/knowledge-facts")
@UseGuards(AdminGuard)
export class AdminKnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get()
  list(@Query() query: AdminKnowledgeQueryDto): Promise<KnowledgeFact[]> {
    return this.knowledgeService.adminList({
      cropId: query.cropId,
      topic: query.topic,
      reviewed: query.reviewed === undefined ? undefined : query.reviewed === "true",
    });
  }

  @Post()
  create(@Body() body: CreateKnowledgeFactDto): Promise<KnowledgeFact> {
    return this.knowledgeService.create(body);
  }

  @Patch(":id")
  update(@Param("id", new ParseUUIDPipe()) id: string, @Body() body: UpdateKnowledgeFactDto): Promise<KnowledgeFact> {
    return this.knowledgeService.update(id, body);
  }

  @Patch(":id/review")
  markReviewed(@Param("id", new ParseUUIDPipe()) id: string): Promise<KnowledgeFact> {
    return this.knowledgeService.markReviewed(id);
  }

  @Delete(":id")
  @HttpCode(204)
  delete(@Param("id", new ParseUUIDPipe()) id: string): Promise<void> {
    return this.knowledgeService.delete(id);
  }
}

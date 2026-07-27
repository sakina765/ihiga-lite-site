import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { AdminConversationDetail, AdminConversationsService } from "./admin-conversations.service";
import { AdminGuard } from "../auth/admin.guard";

@Controller("admin/conversations")
@UseGuards(AdminGuard)
export class AdminConversationsController {
  constructor(private readonly adminConversationsService: AdminConversationsService) {}

  @Get(":id")
  getDetail(@Param("id", new ParseUUIDPipe()) id: string): Promise<AdminConversationDetail> {
    return this.adminConversationsService.getDetail(id);
  }
}

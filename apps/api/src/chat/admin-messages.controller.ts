import { Controller, Param, ParseUUIDPipe, Patch, UseGuards } from "@nestjs/common";
import { AdminConversationsService } from "./admin-conversations.service";
import { Message } from "./entities/message.entity";
import { AdminGuard } from "../auth/admin.guard";

@Controller("admin/messages")
@UseGuards(AdminGuard)
export class AdminMessagesController {
  constructor(private readonly adminConversationsService: AdminConversationsService) {}

  @Patch(":id/flag")
  flag(@Param("id", new ParseUUIDPipe()) id: string): Promise<Message> {
    return this.adminConversationsService.flagMessage(id);
  }

  @Patch(":id/unflag")
  unflag(@Param("id", new ParseUUIDPipe()) id: string): Promise<Message> {
    return this.adminConversationsService.unflagMessage(id);
  }
}

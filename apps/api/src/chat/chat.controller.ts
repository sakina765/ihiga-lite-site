import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { ChatOrchestratorService } from "./chat-orchestrator.service";
import { ChatLanguage } from "../ai/types";
import { ChatResponse } from "./chat.types";

class SendMessageBody {
  conversationId?: string;
  message: string;
  cropId?: string;
  plantingDate?: string;
  language?: ChatLanguage;
}

@Controller("chat")
export class ChatController {
  constructor(private readonly chatOrchestratorService: ChatOrchestratorService) {}

  @Post("message")
  async sendMessage(@Body() body: SendMessageBody): Promise<ChatResponse> {
    if (!body?.message?.trim()) {
      throw new BadRequestException("message is required");
    }
    return this.chatOrchestratorService.handleMessage(body);
  }
}

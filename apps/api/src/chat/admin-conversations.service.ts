import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Conversation } from "./entities/conversation.entity";
import { Message, MessageRole, MessageType } from "./entities/message.entity";
import { KnowledgeService } from "../knowledge/knowledge.service";
import { CropsService } from "../crops/crops.service";
import { ChatLanguage } from "../ai/types";

export interface AdminRetrievedFact {
  id: string;
  topic: string;
  factText: string;
}

export interface AdminMessageDetail {
  id: string;
  role: MessageRole;
  type: MessageType;
  text: string;
  createdAt: Date;
  /** Null = not recorded for this reply (see Message.retrievedFactIds's doc comment) — distinct from an empty array. */
  retrievedFacts: AdminRetrievedFact[] | null;
  flagged: boolean;
  flaggedAt: Date | null;
}

export interface AdminConversationDetail {
  id: string;
  createdAt: Date;
  language: ChatLanguage | null;
  farmerId: string | null;
  cropName: string | null;
  plantingDate: string | null;
  messages: AdminMessageDetail[];
}

@Injectable()
export class AdminConversationsService {
  constructor(
    @InjectRepository(Conversation) private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
    private readonly knowledgeService: KnowledgeService,
    private readonly cropsService: CropsService,
  ) {}

  /**
   * Read-only — renders the exact message thread a farmer saw (see
   * Message.text's own PII-retention doc comment: this is the same plaintext
   * already stored for the farmer-facing /chat/:id endpoint, just surfaced
   * here for review), plus which knowledge facts backed each bot reply and
   * whether an admin has flagged it.
   */
  async getDetail(id: string): Promise<AdminConversationDetail> {
    const conversation = await this.conversationRepository.findOne({ where: { id } });
    if (!conversation) {
      throw new NotFoundException(`No conversation found with id "${id}"`);
    }

    const messages = await this.messageRepository.find({ where: { conversationId: id }, order: { createdAt: "ASC" } });

    const allFactIds = [...new Set(messages.flatMap((message) => message.retrievedFactIds ?? []))];
    const facts = await this.knowledgeService.getByIds(allFactIds);
    const factById = new Map(facts.map((fact) => [fact.id, fact]));

    const cropName = conversation.cropId ? (await this.cropsService.getById(conversation.cropId))?.name ?? null : null;

    return {
      id: conversation.id,
      createdAt: conversation.createdAt,
      language: conversation.language,
      farmerId: conversation.farmerId,
      cropName,
      plantingDate: conversation.plantingDate,
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        type: message.type,
        text: message.text,
        createdAt: message.createdAt,
        retrievedFacts: message.retrievedFactIds
          ? message.retrievedFactIds
              .map((factId) => factById.get(factId))
              .filter((fact): fact is NonNullable<typeof fact> => !!fact)
              .map((fact) => ({ id: fact.id, topic: fact.topic, factText: fact.factText }))
          : null,
        flagged: message.flagged,
        flaggedAt: message.flaggedAt,
      })),
    };
  }

  async flagMessage(id: string): Promise<Message> {
    const message = await this.getMessageOrThrow(id);
    message.flagged = true;
    message.flaggedAt = new Date();
    return this.messageRepository.save(message);
  }

  async unflagMessage(id: string): Promise<Message> {
    const message = await this.getMessageOrThrow(id);
    message.flagged = false;
    message.flaggedAt = null;
    return this.messageRepository.save(message);
  }

  private async getMessageOrThrow(id: string): Promise<Message> {
    const message = await this.messageRepository.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException(`No message found with id "${id}"`);
    }
    return message;
  }
}

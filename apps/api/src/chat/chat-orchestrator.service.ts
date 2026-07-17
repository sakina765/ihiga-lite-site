import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Conversation } from "./entities/conversation.entity";
import { Message } from "./entities/message.entity";
import { LanguageService } from "../language/language.service";
import { SeasonService } from "../season/season.service";
import { CropsService } from "../crops/crops.service";
import { CropStage } from "../crops/entities/crop-stage.entity";
import { KnowledgeService } from "../knowledge/knowledge.service";
import { KnowledgeFact } from "../knowledge/entities/knowledge-fact.entity";
import { GeminiService } from "../ai/gemini.service";
import { ChatLanguage, ConversationTurn, CropStageInfo } from "../ai/types";
import { parseIsoDateStringLocal } from "../common/date.util";
import { extractKeywords } from "./extract-keywords";
import { ChatResponse, HandleMessageParams } from "./chat.types";

const HISTORY_LIMIT = 8;
const MAX_FACTS = 6;

@Injectable()
export class ChatOrchestratorService {
  private readonly logger = new Logger(ChatOrchestratorService.name);

  constructor(
    @InjectRepository(Conversation) private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
    private readonly languageService: LanguageService,
    private readonly seasonService: SeasonService,
    private readonly cropsService: CropsService,
    private readonly knowledgeService: KnowledgeService,
    private readonly geminiService: GeminiService,
  ) {}

  async handleMessage(params: HandleMessageParams): Promise<ChatResponse> {
    let conversation = await this.loadOrCreateConversation(params.conversationId);

    conversation.language = this.resolveLanguage(params, conversation);
    if (params.cropId) {
      conversation.cropId = params.cropId;
    }
    if (params.plantingDate) {
      conversation.plantingDate = params.plantingDate;
    }
    conversation = await this.conversationRepository.save(conversation);

    const season = this.seasonService.getCurrentSeason();
    const cropStage = await this.resolveCropStage(conversation);
    const relevantFacts = await this.searchKnowledge(params.message, conversation.cropId ?? undefined);

    // Fetch prior turns BEFORE inserting this turn's user message, so history
    // doesn't end up duplicating the message we're about to send to Gemini.
    const conversationHistory = await this.getRecentHistory(conversation.id);

    await this.messageRepository.save(
      this.messageRepository.create({ conversationId: conversation.id, role: "user", text: params.message }),
    );

    const structuredReply = await this.geminiService.generateReply({
      userMessage: params.message,
      language: conversation.language ?? "en",
      season,
      cropStage: cropStage ? this.toCropStageInfo(cropStage) : undefined,
      relevantFacts,
      conversationHistory,
    });

    await this.messageRepository.save(
      this.messageRepository.create({ conversationId: conversation.id, role: "bot", text: structuredReply.replyText }),
    );

    return {
      conversationId: conversation.id,
      replyText: structuredReply.replyText,
      suggestedChips: structuredReply.suggestedChips,
      season,
      cropStage: cropStage ? this.toCropStageInfo(cropStage) : undefined,
    };
  }

  private async loadOrCreateConversation(conversationId?: string): Promise<Conversation> {
    if (conversationId) {
      const existing = await this.conversationRepository.findOne({ where: { id: conversationId } });
      if (existing) {
        return existing;
      }
      this.logger.warn(`conversationId "${conversationId}" not found — starting a new conversation instead`);
    }
    return this.conversationRepository.create({ language: null, cropId: null, plantingDate: null });
  }

  private resolveLanguage(params: HandleMessageParams, conversation: Conversation): ChatLanguage {
    if (params.language) {
      return params.language;
    }
    if (conversation.language) {
      return conversation.language;
    }
    return this.languageService.detect(params.message);
  }

  private async resolveCropStage(conversation: Conversation): Promise<CropStage | undefined> {
    if (!conversation.cropId || !conversation.plantingDate) {
      return undefined;
    }
    try {
      const plantingDate = parseIsoDateStringLocal(conversation.plantingDate, "plantingDate");
      return await this.cropsService.getCurrentStage(conversation.cropId, plantingDate);
    } catch (error) {
      this.logger.warn(`Could not resolve crop stage for cropId="${conversation.cropId}": ${(error as Error).message}`);
      return undefined;
    }
  }

  private async searchKnowledge(message: string, cropId?: string): Promise<KnowledgeFact[]> {
    const keywords = extractKeywords(message);
    const searchTerms = keywords.length > 0 ? keywords : [message.trim()].filter(Boolean);

    const resultSets = await Promise.all(searchTerms.map((term) => this.knowledgeService.search(term, cropId)));

    const seen = new Set<string>();
    const merged: KnowledgeFact[] = [];
    for (const fact of resultSets.flat()) {
      if (seen.has(fact.id)) {
        continue;
      }
      seen.add(fact.id);
      merged.push(fact);
      if (merged.length >= MAX_FACTS) {
        break;
      }
    }
    return merged;
  }

  private async getRecentHistory(conversationId: string): Promise<ConversationTurn[]> {
    const messages = await this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: "DESC" },
      take: HISTORY_LIMIT,
    });
    return messages.reverse().map((message) => ({
      role: message.role === "bot" ? ("model" as const) : ("user" as const),
      text: message.text,
    }));
  }

  private toCropStageInfo(stage: CropStage): CropStageInfo {
    return {
      name: stage.name,
      weekStart: stage.weekStart,
      weekEnd: stage.weekEnd,
      taskDescription: stage.taskDescription,
      taskDescriptionRw: stage.taskDescriptionRw,
    };
  }
}

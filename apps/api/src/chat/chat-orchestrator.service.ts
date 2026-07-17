import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Conversation } from "./entities/conversation.entity";
import { Message } from "./entities/message.entity";
import { LanguageService } from "../language/language.service";
import { SeasonService } from "../season/season.service";
import { SeasonInfo } from "../season/season.types";
import { CropsService } from "../crops/crops.service";
import { CropStage } from "../crops/entities/crop-stage.entity";
import { KnowledgeService } from "../knowledge/knowledge.service";
import { KnowledgeFact } from "../knowledge/entities/knowledge-fact.entity";
import { GroqService } from "../ai/groq.service";
import { ChatLanguage, ConversationTurn, CropStageInfo } from "../ai/types";
import { parseIsoDateStringLocal } from "../common/date.util";
import { extractKeywords } from "./extract-keywords";
import { ChatResponse, HandleMessageParams, HandlePhotoMessageParams } from "./chat.types";

const HISTORY_LIMIT = 8;
const MAX_FACTS = 6;

interface TurnContext {
  conversation: Conversation;
  season: SeasonInfo;
  cropStage?: CropStage;
}

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
    private readonly groqService: GroqService,
  ) {}

  async handleMessage(params: HandleMessageParams): Promise<ChatResponse> {
    const { conversation, season, cropStage } = await this.prepareTurnContext({
      conversationId: params.conversationId,
      cropId: params.cropId,
      plantingDate: params.plantingDate,
      language: params.language,
      languageDetectionText: params.message,
    });

    const relevantFacts = await this.searchKnowledge(params.message, conversation.cropId ?? undefined);

    // Fetch prior turns BEFORE inserting this turn's user message, so history
    // doesn't end up duplicating the message we're about to send to Groq.
    const conversationHistory = await this.getRecentHistory(conversation.id);

    await this.messageRepository.save(
      this.messageRepository.create({
        conversationId: conversation.id,
        role: "user",
        type: params.messageType ?? "text",
        text: params.message,
      }),
    );

    const structuredReply = await this.groqService.generateReply({
      userMessage: params.message,
      language: conversation.language ?? "en",
      season,
      cropStage: cropStage ? this.toCropStageInfo(cropStage) : undefined,
      relevantFacts,
      conversationHistory,
    });

    await this.persistBotReply(conversation.id, structuredReply.replyText);

    return this.toChatResponse(conversation, season, cropStage, structuredReply);
  }

  /**
   * Photo analysis is different enough from text/voice (a vision model call
   * instead of generateReply) to warrant its own method, but reuses the same
   * conversation/season/crop-stage/knowledge-context gathering and persistence
   * pattern via the shared private helpers below.
   */
  async handlePhotoMessage(params: HandlePhotoMessageParams): Promise<ChatResponse> {
    const { conversation, season, cropStage } = await this.prepareTurnContext({
      conversationId: params.conversationId,
      cropId: params.cropId,
      plantingDate: params.plantingDate,
      language: params.language,
      languageDetectionText: params.caption ?? "",
    });

    const relevantFacts = await this.searchKnowledge(params.caption ?? "", conversation.cropId ?? undefined);

    await this.messageRepository.save(
      this.messageRepository.create({
        conversationId: conversation.id,
        role: "user",
        type: "photo",
        text: params.caption ?? "[Photo shared]",
      }),
    );

    const structuredReply = await this.groqService.analyzeImage(params.imageBuffer, params.mimeType, {
      language: conversation.language ?? "en",
      season,
      cropStage: cropStage ? this.toCropStageInfo(cropStage) : undefined,
      relevantFacts,
      caption: params.caption,
    });

    await this.persistBotReply(conversation.id, structuredReply.replyText);

    return this.toChatResponse(conversation, season, cropStage, structuredReply);
  }

  private async prepareTurnContext(input: {
    conversationId?: string;
    cropId?: string;
    plantingDate?: string;
    language?: ChatLanguage;
    languageDetectionText: string;
  }): Promise<TurnContext> {
    let conversation = await this.loadOrCreateConversation(input.conversationId);

    conversation.language = this.resolveLanguage(input.language, input.languageDetectionText, conversation);
    if (input.cropId) {
      conversation.cropId = input.cropId;
    }
    if (input.plantingDate) {
      conversation.plantingDate = input.plantingDate;
    }
    conversation = await this.conversationRepository.save(conversation);

    const season = this.seasonService.getCurrentSeason();
    const cropStage = await this.resolveCropStage(conversation);

    return { conversation, season, cropStage };
  }

  private async persistBotReply(conversationId: string, replyText: string): Promise<void> {
    await this.messageRepository.save(
      this.messageRepository.create({ conversationId, role: "bot", type: "text", text: replyText }),
    );
  }

  private toChatResponse(
    conversation: Conversation,
    season: SeasonInfo,
    cropStage: CropStage | undefined,
    structuredReply: { replyText: string; suggestedChips: string[] },
  ): ChatResponse {
    return {
      conversationId: conversation.id,
      replyText: structuredReply.replyText,
      suggestedChips: structuredReply.suggestedChips,
      language: conversation.language ?? "en",
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

  private resolveLanguage(
    explicitLanguage: ChatLanguage | undefined,
    detectionText: string,
    conversation: Conversation,
  ): ChatLanguage {
    if (explicitLanguage) {
      return explicitLanguage;
    }
    if (conversation.language) {
      return conversation.language;
    }
    return this.languageService.detect(detectionText);
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
    const trimmed = message.trim();
    // No keywords/text to search on (e.g. a photo with no caption) but the crop
    // is known: still search, scoped to that crop, so the vision prompt gets
    // general crop facts rather than nothing at all.
    const searchTerms = keywords.length > 0 ? keywords : trimmed ? [trimmed] : cropId ? [""] : [];

    if (searchTerms.length === 0) {
      return [];
    }

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

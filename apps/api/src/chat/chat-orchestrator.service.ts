import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { Conversation } from "./entities/conversation.entity";
import { Message } from "./entities/message.entity";
import { LanguageService } from "../language/language.service";
import { SeasonService } from "../season/season.service";
import { SeasonInfo } from "../season/season.types";
import { CropsService } from "../crops/crops.service";
import { CropSuggestionsService } from "../crops/crop-suggestions.service";
import { CropStage } from "../crops/entities/crop-stage.entity";
import { KnowledgeService } from "../knowledge/knowledge.service";
import { KnowledgeFact } from "../knowledge/entities/knowledge-fact.entity";
import { GroqService } from "../ai/groq.service";
import { ChatLanguage, ConversationTurn, CropStageInfo, StructuredReply } from "../ai/types";
import { FarmersService } from "../farmers/farmers.service";
import { Farmer } from "../farmers/entities/farmer.entity";
import { WeatherService } from "../weather/weather.service";
import { WeatherInfo } from "../weather/weather.types";
import { parseIsoDateStringLocal } from "../common/date.util";
import { extractKeywords } from "./extract-keywords";
import { ChatResponse, HandleMessageParams, HandlePhotoMessageParams } from "./chat.types";
import { Crop } from "../crops/entities/crop.entity";

const HISTORY_LIMIT = 8;
const MAX_FACTS = 6;

const MONTH_ABBREVIATIONS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Always English regardless of conversation language — deliberately, so it's
// an exact, reproducible string both when we generate it and when we compare
// an incoming message against it (see resolvePendingCropConfirmation). A
// translated chip would need translated matching too, and chip taps are
// exact-string round-trips anyway, not something a farmer types by hand.
const DECLINE_CHIP_TEXT = "No, that's not right";

function formatPlantingDateForChip(isoDate: string): string {
  const date = parseIsoDateStringLocal(isoDate, "plantingDate");
  return `${MONTH_ABBREVIATIONS[date.getMonth()]} ${date.getDate()}`;
}

/** Shared by both the proposal (this is the chip text shown) and the confirmation check (the incoming message must match exactly) — one function, so the two can never drift apart. */
function buildConfirmChipText(cropName: string, plantingDate: string): string {
  return `Yes, track ${cropName} (planted ${formatPlantingDateForChip(plantingDate)})`;
}

interface PendingCropProposal {
  cropSlug: string;
  cropName: string;
  plantingDate: string;
}

interface TurnContext {
  conversation: Conversation;
  season: SeasonInfo;
  cropStage?: CropStage;
  weather?: WeatherInfo;
  seasonalCrops?: string[];
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
    private readonly cropSuggestionsService: CropSuggestionsService,
    private readonly knowledgeService: KnowledgeService,
    private readonly groqService: GroqService,
    private readonly farmersService: FarmersService,
    private readonly weatherService: WeatherService,
  ) {}

  async handleMessage(params: HandleMessageParams): Promise<ChatResponse> {
    // A pending crop-tracking proposal from the PREVIOUS turn takes priority
    // over the normal flow: this message either confirms it (exact chip-text
    // match) or doesn't (decline chip, or literally anything else the farmer
    // sent instead) — either way it's resolved here, never left dangling into
    // a third turn, and a confirm short-circuits the rest of this method
    // entirely (no fresh Groq call needed for a deterministic "yes").
    if (params.conversationId) {
      const confirmationResponse = await this.resolvePendingCropConfirmation(params.conversationId, params.message);
      if (confirmationResponse) {
        return confirmationResponse;
      }
    }

    const { conversation, season, cropStage, weather, seasonalCrops } = await this.prepareTurnContext({
      conversationId: params.conversationId,
      farmerId: params.farmerId,
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
      weather,
      seasonalCrops,
    });

    await this.persistBotReply(conversation.id, structuredReply.replyText);

    const pendingProposal = await this.maybeProposeCropTracking(conversation, structuredReply);

    return this.toChatResponse(conversation, season, cropStage, structuredReply, pendingProposal);
  }

  /**
   * Photo analysis is different enough from text/voice (a vision model call
   * instead of generateReply) to warrant its own method, but reuses the same
   * conversation/season/crop-stage/weather/knowledge-context gathering and
   * persistence pattern via the shared private helpers below.
   */
  async handlePhotoMessage(params: HandlePhotoMessageParams): Promise<ChatResponse> {
    const { conversation, season, cropStage, weather, seasonalCrops } = await this.prepareTurnContext({
      conversationId: params.conversationId,
      farmerId: params.farmerId,
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
      weather,
      seasonalCrops,
    });

    await this.persistBotReply(conversation.id, structuredReply.replyText);

    const pendingProposal = await this.maybeProposeCropTracking(conversation, structuredReply);

    return this.toChatResponse(conversation, season, cropStage, structuredReply, pendingProposal);
  }

  private async prepareTurnContext(input: {
    conversationId?: string;
    farmerId: string;
    cropId?: string;
    plantingDate?: string;
    language?: ChatLanguage;
    languageDetectionText: string;
  }): Promise<TurnContext> {
    let conversation = await this.loadOrCreateConversation(input.conversationId, input.farmerId);
    const farmer = await this.farmersService.getById(input.farmerId);

    conversation.language = this.resolveLanguage(input.language, input.languageDetectionText, conversation, farmer);
    conversation.farmerId = input.farmerId;
    if (input.cropId) {
      conversation.cropId = input.cropId;
    }
    if (input.plantingDate) {
      conversation.plantingDate = input.plantingDate;
    }
    conversation = await this.conversationRepository.save(conversation);

    const season = this.seasonService.getCurrentSeason();
    const cropStage = await this.resolveCropStage(conversation);
    const weather = await this.resolveWeather(farmer);
    const seasonalCrops = this.resolveSeasonalCrops(farmer);

    return { conversation, season, cropStage, weather, seasonalCrops };
  }

  /** Absent when the farmer isn't found, hasn't given a district yet, or the district doesn't map to a known province. */
  private resolveSeasonalCrops(farmer: Farmer | null): string[] | undefined {
    if (!farmer?.district) {
      return undefined;
    }
    const { crops } = this.cropSuggestionsService.getSuggestions(farmer.district);
    if (crops.length === 0) {
      return undefined;
    }
    return crops.map((c) => (c.localName ? `${c.name} (${c.localName})` : c.name));
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
    pendingProposal?: PendingCropProposal | null,
  ): ChatResponse {
    // A freshly-proposed crop replaces this turn's own suggested chips with
    // the confirm/deny pair — confirming (or declining) the crop is the one
    // thing that actually matters next, so it shouldn't compete for attention
    // alongside Groq's own follow-up suggestions.
    const suggestedChips = pendingProposal
      ? [buildConfirmChipText(pendingProposal.cropName, pendingProposal.plantingDate), DECLINE_CHIP_TEXT]
      : structuredReply.suggestedChips;

    return {
      conversationId: conversation.id,
      replyText: structuredReply.replyText,
      suggestedChips,
      language: conversation.language ?? "en",
      season,
      cropStage: cropStage ? this.toCropStageInfo(cropStage) : undefined,
      pendingCropConfirmation: pendingProposal ?? undefined,
    };
  }

  /**
   * Checks whether Groq just confidently extracted a crop+planting date this
   * turn and, if so, stages it as a PENDING proposal (Conversation.pendingCropSlug/
   * pendingPlantingDate) rather than writing cropId/plantingDate directly —
   * the farmer has to actually confirm before anything real gets tracked.
   * Never re-triggers for a farmer who already has a tracked crop, so this
   * only ever fires once per conversation.
   */
  private async maybeProposeCropTracking(
    conversation: Conversation,
    structuredReply: StructuredReply,
  ): Promise<PendingCropProposal | null> {
    if (conversation.cropId || conversation.cropTrackingDeclined) {
      return null;
    }
    if (!structuredReply.extractedCropSlug || !structuredReply.extractedPlantingDate) {
      return null;
    }

    let crop: Crop;
    try {
      crop = await this.cropsService.getCropBySlug(structuredReply.extractedCropSlug);
    } catch (error) {
      // Expected, not exceptional: Groq can now extract any crop name the
      // farmer types, not just the seeded ones, so a slug with no matching
      // Crop row (or a perennial crop with no stage tracking configured) is a
      // normal outcome — just means there's no stage-tracking proposal to
      // make this turn, not an error. The farmer's message is still answered
      // normally via GroqService's own (possibly general-knowledge) reply.
      this.logger.log(`Extracted crop slug "${structuredReply.extractedCropSlug}" has no trackable crop row yet: ${(error as Error).message}`);
      return null;
    }

    conversation.pendingCropSlug = structuredReply.extractedCropSlug;
    conversation.pendingPlantingDate = structuredReply.extractedPlantingDate;
    await this.conversationRepository.save(conversation);

    return {
      cropSlug: structuredReply.extractedCropSlug,
      cropName: crop.name,
      plantingDate: structuredReply.extractedPlantingDate,
    };
  }

  /**
   * Returns a ChatResponse if `message` resolves a pending crop-tracking
   * proposal (confirmed or declined/ignored), or null if there was no
   * pending proposal at all — in which case the caller should proceed with
   * the normal Groq-backed flow for this message. Either way a pending
   * proposal is cleared as a side effect here, so it never lingers into a
   * third turn.
   */
  private async resolvePendingCropConfirmation(conversationId: string, message: string): Promise<ChatResponse | null> {
    const conversation = await this.conversationRepository.findOne({ where: { id: conversationId } });
    if (!conversation?.pendingCropSlug || !conversation.pendingPlantingDate) {
      return null;
    }

    const pendingSlug = conversation.pendingCropSlug;
    const pendingDate = conversation.pendingPlantingDate;

    let crop: Crop;
    try {
      crop = await this.cropsService.getCropBySlug(pendingSlug);
    } catch (error) {
      this.logger.warn(`Pending crop slug "${pendingSlug}" no longer resolves: ${(error as Error).message}`);
      conversation.pendingCropSlug = null;
      conversation.pendingPlantingDate = null;
      await this.conversationRepository.save(conversation);
      return null;
    }

    const isConfirmed = message.trim() === buildConfirmChipText(crop.name, pendingDate);

    // Resolved either way — confirmed or not — so it's never asked again.
    conversation.pendingCropSlug = null;
    conversation.pendingPlantingDate = null;

    if (!isConfirmed) {
      // Without this flag, Groq's very next (normal fallback) reply would
      // often re-extract the exact same crop+date from the farmer's own
      // recent message and immediately re-propose it — reading as the bot
      // ignoring the farmer's "no" a moment ago. Declining suppresses
      // auto-proposals for the rest of this conversation; the manual
      // fallback form is unaffected.
      conversation.cropTrackingDeclined = true;
      await this.conversationRepository.save(conversation);
      return null;
    }

    conversation.cropId = crop.id;
    conversation.plantingDate = pendingDate;
    const savedConversation = await this.conversationRepository.save(conversation);

    await this.messageRepository.save(
      this.messageRepository.create({ conversationId: savedConversation.id, role: "user", type: "text", text: message }),
    );

    const season = this.seasonService.getCurrentSeason();
    const cropStage = await this.resolveCropStage(savedConversation);
    const replyText = this.buildTrackingConfirmedReplyText(crop, pendingDate, savedConversation.language ?? "en");

    await this.persistBotReply(savedConversation.id, replyText);

    return this.toChatResponse(savedConversation, season, cropStage, { replyText, suggestedChips: [] });
  }

  private buildTrackingConfirmedReplyText(crop: Crop, plantingDate: string, language: ChatLanguage): string {
    const formatted = formatPlantingDateForChip(plantingDate);
    const templates: Record<ChatLanguage, string> = {
      en: `Got it — I'll track your ${crop.name.toLowerCase()} planted on ${formatted}.`,
      rw: `Byakiriwe — nzakurikirana ${crop.localName} yatewe kuwa ${formatted}.`,
      fr: `C'est noté — je vais suivre votre ${crop.name.toLowerCase()} planté le ${formatted}.`,
    };
    return templates[language] ?? templates.en;
  }

  private async loadOrCreateConversation(conversationId: string | undefined, farmerId: string): Promise<Conversation> {
    if (conversationId) {
      const existing = await this.conversationRepository.findOne({ where: { id: conversationId } });
      if (existing) {
        return existing;
      }
      this.logger.warn(`conversationId "${conversationId}" not found — starting a new conversation instead`);
    }

    // The frontend doesn't persist conversationId across page loads, so every
    // fresh session lands here with no conversationId — without this lookup,
    // a farmer who already confirmed crop tracking in an earlier conversation
    // would appear crop-less again on their very next visit, even though the
    // "Your crop" sidebar (CurrentCropService, same underlying query) already
    // knows about it. Carry the farmer's most recently tracked crop forward
    // so a brand-new conversation isn't blind to something they already told us.
    const previouslyTracked = await this.conversationRepository.findOne({
      where: { farmerId, cropId: Not(IsNull()), plantingDate: Not(IsNull()) },
      order: { createdAt: "DESC" },
    });

    return this.conversationRepository.create({
      language: null,
      farmerId: null,
      cropId: previouslyTracked?.cropId ?? null,
      plantingDate: previouslyTracked?.plantingDate ?? null,
    });
  }

  private resolveLanguage(
    explicitLanguage: ChatLanguage | undefined,
    detectionText: string,
    conversation: Conversation,
    farmer: Farmer | null,
  ): ChatLanguage {
    if (explicitLanguage) {
      return explicitLanguage;
    }
    // Phase 9: an explicit, farmer-chosen UI language (set at onboarding or via
    // the persistent switcher) is the authoritative baseline once it exists —
    // it overrides per-message auto-detection entirely, so Groq's replies stay
    // consistent with what the farmer actually picked rather than a guess that
    // can misfire on a single ambiguous message. Detection below only ever
    // runs for a farmer who hasn't set a preference at all.
    if (farmer?.preferredLanguage) {
      return farmer.preferredLanguage;
    }
    // Re-detect from THIS message every turn rather than sticking with
    // whatever the conversation's language was set to on turn one — farmers
    // switch language mid-conversation (typing in French after starting in
    // English, say) and expect Ihiga to follow along.
    //
    // But detect() has no marker list for English — "en" out of detect() is
    // ambiguous: it means either "this is genuinely English" OR "no fr/rw
    // markers matched at all" (a crop name, a short reply, an unlisted word).
    // Once a conversation has a confidently-detected non-English language,
    // treat a later "en" result as the latter (noise), not a real signal to
    // reset — a single ambiguous message (e.g. "Riz") shouldn't silently
    // knock an established French/Kinyarwanda conversation back to English.
    // A confident fr/rw detection always wins and can still switch between
    // the two.
    if (detectionText.trim()) {
      const detected = this.languageService.detect(detectionText);
      if (detected !== "en" || !conversation.language) {
        return detected;
      }
      return conversation.language;
    }
    // No text to detect from (e.g. an uncaptioned photo) — nothing to go on,
    // so keep whatever language the conversation is already in rather than
    // resetting to English by default.
    return conversation.language ?? "en";
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

  /** Absent (not an error) when the farmer isn't found or hasn't given a district yet. */
  private async resolveWeather(farmer: Farmer | null): Promise<WeatherInfo | undefined> {
    if (!farmer?.district) {
      return undefined;
    }
    try {
      return await this.weatherService.getForecast(farmer.district);
    } catch (error) {
      this.logger.warn(`Could not resolve weather for district="${farmer.district}": ${(error as Error).message}`);
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

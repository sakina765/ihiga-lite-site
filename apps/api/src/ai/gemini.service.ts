import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ChatLanguage, GenerateReplyParams, StructuredReply } from "./types";

// "gemini-2.5-flash" (the originally intended free-tier model) returns 404 for
// newer API keys/projects — Google has moved new accounts off that pinned ID.
// "gemini-flash-latest" is Google's alias for the current recommended flash-tier
// model (verified live: currently resolves to gemini-3.5-flash), which avoids
// repeating this breakage every time a pinned version gets retired.
const GEMINI_MODEL = "gemini-flash-latest";

const SYSTEM_PROMPT = `You are Ihiga Lite, an agricultural advisory assistant for smallholder farmers in Rwanda.

Rules you MUST follow on every reply:
1. Answer ONLY using the CONTEXT block provided with each message (current season, crop stage, and knowledge facts). Do not rely on outside/general agricultural knowledge beyond what CONTEXT gives you.
2. If CONTEXT does not cover what the farmer is asking, say so honestly (e.g. "I don't have reliable information on that yet") instead of guessing or inventing an answer.
3. Always reply in the language given by "language" in CONTEXT: "en" = English, "rw" = Kinyarwanda, "fr" = French.
4. Keep replies concise and practical — this is delivered over SMS/low-bandwidth chat, not a long essay. A few short sentences is usually enough.
5. If CONTEXT says no crop/planting date has been given yet, ask a brief clarifying question (e.g. which crop they planted, and when) using the season context to make it concrete, rather than giving generic advice.
6. Respond with ONLY valid JSON matching the required schema: replyText (string, in the farmer's language), suggestedChips (2-4 short follow-up action strings, in the farmer's language), detectedTopics (short English topic keywords like "pest", "fertilizer", "irrigation", "harvest").`;

const STRUCTURED_REPLY_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    replyText: { type: SchemaType.STRING },
    suggestedChips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    detectedTopics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ["replyText", "suggestedChips", "detectedTopics"],
};

const FALLBACK_MESSAGES: Record<ChatLanguage, string> = {
  en: "Sorry, I'm having trouble answering right now. Please try again in a moment.",
  rw: "Mbabarira, mfite ikibazo cyo gutanga igisubizo ubu. Ongera ugerageze nyuma y'akanya gato.",
  fr: "Désolé, je rencontre un problème pour répondre en ce moment. Merci de réessayer dans un instant.",
};

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    this.client = new GoogleGenerativeAI(this.configService.get<string>("GEMINI_API_KEY") ?? "");
  }

  async generateReply(params: GenerateReplyParams): Promise<StructuredReply> {
    const startedAt = Date.now();

    try {
      const model = this.client.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: STRUCTURED_REPLY_SCHEMA,
          temperature: 0.4,
        },
      });

      const history = (params.conversationHistory ?? []).map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      }));

      const chat = model.startChat({ history });
      const message = `CONTEXT:\n${this.buildContextBlock(params)}\n\nFarmer's message: ${params.userMessage}`;

      const result = await chat.sendMessage(message);
      const responseText = result.response.text();
      const usage = result.response.usageMetadata;
      const latencyMs = Date.now() - startedAt;

      this.logger.log(
        `generateReply ok — inChars=${params.userMessage.length} outChars=${responseText.length} latencyMs=${latencyMs}` +
          (usage
            ? ` promptTokens=${usage.promptTokenCount} candidateTokens=${usage.candidatesTokenCount} totalTokens=${usage.totalTokenCount}`
            : ""),
      );

      return this.parseStructuredReply(responseText, params.language);
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      this.logger.error(`generateReply failed after ${latencyMs}ms: ${(error as Error).message}`);
      return this.fallbackReply(params.language);
    }
  }

  private buildContextBlock(params: GenerateReplyParams): string {
    const lines: string[] = [];
    lines.push(`language: ${params.language}`);
    lines.push(
      `current_season: ${params.season.code} — ${params.season.englishName} (${params.season.localName}), ` +
        `${params.season.startDate.toDateString()} to ${params.season.endDate.toDateString()}`,
    );

    if (params.cropStage) {
      lines.push(`crop_stage: "${params.cropStage.name}" (week ${params.cropStage.weekStart}-${params.cropStage.weekEnd})`);
      lines.push(`stage_task_en: ${params.cropStage.taskDescription}`);
      if (params.cropStage.taskDescriptionRw) {
        lines.push(`stage_task_rw: ${params.cropStage.taskDescriptionRw}`);
      }
    } else {
      lines.push("crop_stage: none — the farmer has not specified a crop and planting date yet");
    }

    if (params.relevantFacts.length > 0) {
      lines.push("knowledge_facts:");
      params.relevantFacts.forEach((fact, index) => {
        lines.push(`  ${index + 1}. [${fact.topic}] ${fact.factText} (source: ${fact.source})`);
      });
    } else {
      lines.push("knowledge_facts: none found for this query");
    }

    return lines.join("\n");
  }

  private parseStructuredReply(rawText: string, language: ChatLanguage): StructuredReply {
    try {
      const parsed = JSON.parse(rawText);
      return {
        replyText: typeof parsed.replyText === "string" ? parsed.replyText : this.fallbackReply(language).replyText,
        suggestedChips: Array.isArray(parsed.suggestedChips)
          ? parsed.suggestedChips.filter((chip: unknown): chip is string => typeof chip === "string")
          : [],
        detectedTopics: Array.isArray(parsed.detectedTopics)
          ? parsed.detectedTopics.filter((topic: unknown): topic is string => typeof topic === "string")
          : [],
      };
    } catch (error) {
      this.logger.warn(`generateReply: could not parse Gemini JSON response — ${(error as Error).message}`);
      return this.fallbackReply(language);
    }
  }

  private fallbackReply(language: ChatLanguage): StructuredReply {
    return {
      replyText: FALLBACK_MESSAGES[language] ?? FALLBACK_MESSAGES.en,
      suggestedChips: [],
      detectedTopics: [],
    };
  }
}

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI, { toFile } from "openai";
import { AnalyzeImageContext, ChatLanguage, GenerateReplyParams, StructuredReply } from "./types";

// Groq's API is OpenAI-compatible, so we use the `openai` SDK pointed at Groq's
// base URL rather than a Groq-specific client.
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

// llama-3.3-70b-versatile: good general-purpose quality for advisory replies.
// llama-3.1-8b-instant is available as a faster, higher-quota fallback if the
// 70b model's daily request limit becomes a bottleneck.
const GROQ_CHAT_MODEL = "llama-3.3-70b-versatile";

// whisper-large-v3: Groq's Whisper-compatible speech-to-text model.
// whisper-large-v3-turbo is available as a faster alternative if latency matters
// more than transcription accuracy for a given use case.
const GROQ_WHISPER_MODEL = "whisper-large-v3";

// Verified live via GET https://api.groq.com/openai/v1/models: the previously
// documented "llama-3.2-90b-vision-preview" is no longer listed at all — Groq
// has retired it. The current vision-capable (text+image input) models are
// meta-llama/llama-4-scout-17b-16e-instruct and qwen/qwen3.6-27b; we use the
// Llama one for family-consistency with GROQ_CHAT_MODEL and because it
// supports json_mode for structured output.
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

// Groq free tier (at time of writing): ~30 requests/minute and roughly 1,000+
// requests/day depending on model — far above the 20/day cap we hit on Gemini
// for this project, which is why we migrated. Rate-limit errors from the API
// will reference these ceilings.
const GROQ_REQUEST_TIMEOUT_MS = 60_000;

// Must stay in sync with the seeded crops in crops.seed-data.ts — these are
// the only slugs a farmer can actually be tracked against today. Extraction
// output outside this list is discarded (see parseStructuredReply) rather
// than trusted, since a slug the DB doesn't recognize can't resolve to a
// real Crop row anyway.
const KNOWN_CROP_SLUGS = ["maize", "beans", "irish-potato"] as const;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const EXTRACTION_JSON_SHAPE_FIELDS =
  `"extractedCropSlug": string | null (one of "maize", "beans", "irish-potato" — ONLY when the farmer clearly and specifically names one of these AND gives a specific planting date/timeframe in this message; null otherwise, never guess), ` +
  `"extractedPlantingDate": string | null (YYYY-MM-DD, resolved from today's date if the farmer gave a relative timeframe like "3 weeks ago" — only non-null together with extractedCropSlug)`;

const SYSTEM_PROMPT = `You are Ihiga Lite, an agricultural advisory assistant for smallholder farmers in Rwanda.

Rules you MUST follow on every reply:
1. Answer ONLY using the CONTEXT block provided with each message (current season, crop stage, knowledge facts, and today's weather). Do not rely on outside/general agricultural knowledge beyond what CONTEXT gives you.
2. If CONTEXT does not cover what the farmer is asking, say so honestly (e.g. "I don't have reliable information on that yet") instead of guessing or inventing an answer.
3. Always reply in the language given by "language" in CONTEXT: "en" = English, "rw" = Kinyarwanda, "fr" = French.
4. Keep replies concise and practical — this is delivered over SMS/low-bandwidth chat, not a long essay. A few short sentences is usually enough.
5. If CONTEXT says no crop/planting date has been given yet, ask a brief clarifying question (e.g. which crop they planted, and when) using the season context to make it concrete, rather than giving generic advice.
6. If the farmer clearly and specifically states BOTH a recognizable crop (maize, beans, or Irish potato) AND a specific planting date or timeframe in THIS message (e.g. "I planted maize on March 1st", "my beans went in 3 weeks ago") — not a vague mention like "my crops are struggling" — populate extractedCropSlug/extractedPlantingDate below. If either is vague, missing, or not one of those three crops, set BOTH to null. A wrong extraction is worse than none, so prefer null whenever you're not confident.
7. Respond with ONLY a single valid JSON object matching this exact shape — no markdown code fences, no text outside the JSON:
{"replyText": string (in the farmer's language), "suggestedChips": string[] (2-4 short follow-up action strings, in the farmer's language), "detectedTopics": string[] (short English topic keywords like "pest", "fertilizer", "irrigation", "harvest"), ${EXTRACTION_JSON_SHAPE_FIELDS}}`;

// Vision gets its own, stricter system prompt: visual diagnosis of pests/disease
// from a single photo is inherently less reliable than the grounded text RAG
// flow, and a confidently wrong pest/disease call could lead a farmer to apply
// the wrong treatment to a real crop. Honesty about uncertainty is the whole
// point here, not an afterthought.
const VISION_SYSTEM_PROMPT = `You are Ihiga Lite, an agricultural advisory assistant for smallholder farmers in Rwanda, looking at a photo a farmer has shared of their crop.

Rules you MUST follow on every reply:
1. Describe only what is visibly consistent with the image. If the photo is blurry, poorly lit, too distant, or otherwise not clear enough to make a confident call, say so plainly instead of guessing.
2. NEVER state a pest, disease, or deficiency diagnosis with confidence unless the visual symptoms are distinctive and clearly visible. Prefer hedged language ("this could be...", "this looks consistent with..., but a closer look or a second opinion would help") over definitive claims — a wrong confident diagnosis can lead to the wrong treatment being applied to a real crop.
3. Use the CONTEXT block (current season, the farmer's crop stage if known, knowledge facts, and today's weather) to inform your answer where visually relevant — e.g. if the farmer's crop and a matching pest/disease fact are both in CONTEXT and the photo is visually consistent with it, you may reference it. Do not invent facts beyond CONTEXT and what you can see.
4. Always reply in the language given by "language" in CONTEXT: "en" = English, "rw" = Kinyarwanda, "fr" = French.
5. Keep replies concise and practical — a few short sentences is usually enough.
6. If the farmer's caption clearly and specifically states BOTH a recognizable crop (maize, beans, or Irish potato) AND a specific planting date or timeframe — populate extractedCropSlug/extractedPlantingDate below; otherwise set both to null. A wrong extraction is worse than none.
7. Respond with ONLY a single valid JSON object matching this exact shape — no markdown code fences, no text outside the JSON:
{"replyText": string (in the farmer's language), "suggestedChips": string[] (2-4 short follow-up action strings, in the farmer's language), "detectedTopics": string[] (short English topic keywords like "pest", "disease", "nutrient deficiency"), ${EXTRACTION_JSON_SHAPE_FIELDS}}`;

const FALLBACK_MESSAGES: Record<ChatLanguage, string> = {
  en: "Sorry, I'm having trouble answering right now. Please try again in a moment.",
  rw: "Mbabarira, mfite ikibazo cyo gutanga igisubizo ubu. Ongera ugerageze nyuma y'akanya gato.",
  fr: "Désolé, je rencontre un problème pour répondre en ce moment. Merci de réessayer dans un instant.",
};

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>("GROQ_API_KEY") ?? "",
      baseURL: GROQ_BASE_URL,
    });
  }

  async generateReply(params: GenerateReplyParams): Promise<StructuredReply> {
    const startedAt = Date.now();

    try {
      const history = (params.conversationHistory ?? []).map((turn) => ({
        role: (turn.role === "model" ? "assistant" : "user") as "assistant" | "user",
        content: turn.text,
      }));

      const message = `CONTEXT:\n${this.buildContextLines(params).join("\n")}\n\nFarmer's message: ${params.userMessage}`;

      const completion = await this.client.chat.completions.create(
        {
          model: GROQ_CHAT_MODEL,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history, { role: "user", content: message }],
          response_format: { type: "json_object" },
          temperature: 0.4,
        },
        { timeout: GROQ_REQUEST_TIMEOUT_MS },
      );

      const responseText = completion.choices[0]?.message?.content ?? "";
      const latencyMs = Date.now() - startedAt;
      this.logLLMUsage("generateReply", GROQ_CHAT_MODEL, params.userMessage.length, responseText.length, latencyMs, completion.usage);

      return this.parseStructuredReply(responseText, params.language);
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      this.logger.error(`generateReply [chat/${GROQ_CHAT_MODEL}] failed after ${latencyMs}ms: ${(error as Error).message}`);
      return this.fallbackReply(params.language);
    }
  }

  /**
   * Transcribes an audio clip via Groq's Whisper endpoint. Deliberately does
   * nothing beyond transcription — the caller hands the resulting text to
   * generateReply()/the orchestrator exactly like a typed message.
   */
  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    const startedAt = Date.now();
    const extension = mimeType.split("/")[1]?.split(";")[0] || "webm";

    try {
      const file = await toFile(audioBuffer, `audio.${extension}`, { type: mimeType });
      const transcription = await this.client.audio.transcriptions.create(
        { file, model: GROQ_WHISPER_MODEL },
        { timeout: GROQ_REQUEST_TIMEOUT_MS },
      );
      const latencyMs = Date.now() - startedAt;
      this.logger.log(
        `transcribeAudio [whisper/${GROQ_WHISPER_MODEL}] ok — inBytes=${audioBuffer.length} outChars=${transcription.text.length} latencyMs=${latencyMs}`,
      );
      return transcription.text;
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      this.logger.error(
        `transcribeAudio [whisper/${GROQ_WHISPER_MODEL}] failed after ${latencyMs}ms: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Analyzes a plant photo using Groq's vision-capable model, grounded with the
   * same season/crop/knowledge context as text replies where relevant.
   */
  async analyzeImage(imageBuffer: Buffer, mimeType: string, context: AnalyzeImageContext): Promise<StructuredReply> {
    const startedAt = Date.now();

    try {
      const contextLines = this.buildContextLines(context);
      if (context.caption) {
        contextLines.push(`farmer_caption: ${context.caption}`);
      }
      const promptText = `CONTEXT:\n${contextLines.join("\n")}\n\nThe farmer has shared a photo of their crop. Look at the image and respond following your instructions.`;
      const dataUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;

      const completion = await this.client.chat.completions.create(
        {
          model: GROQ_VISION_MODEL,
          messages: [
            { role: "system", content: VISION_SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                { type: "text", text: promptText },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        },
        { timeout: GROQ_REQUEST_TIMEOUT_MS },
      );

      const responseText = completion.choices[0]?.message?.content ?? "";
      const latencyMs = Date.now() - startedAt;
      this.logLLMUsage("analyzeImage", GROQ_VISION_MODEL, imageBuffer.length, responseText.length, latencyMs, completion.usage);

      return this.parseStructuredReply(responseText, context.language);
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      this.logger.error(`analyzeImage [vision/${GROQ_VISION_MODEL}] failed after ${latencyMs}ms: ${(error as Error).message}`);
      return this.fallbackReply(context.language);
    }
  }

  private buildContextLines(params: {
    language: ChatLanguage;
    season: GenerateReplyParams["season"];
    cropStage?: GenerateReplyParams["cropStage"];
    relevantFacts: GenerateReplyParams["relevantFacts"];
    weather?: GenerateReplyParams["weather"];
  }): string[] {
    const lines: string[] = [];
    lines.push(`language: ${params.language}`);
    // Lets the model resolve a relative timeframe ("3 weeks ago", "last month")
    // into an absolute YYYY-MM-DD for extractedPlantingDate, rather than
    // guessing what "today" is.
    lines.push(`today: ${new Date().toISOString().slice(0, 10)}`);
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
        // Validated native Kinyarwanda text, when we have it, is more reliable
        // than Groq's own live translation of the English fact — surface it
        // alongside rather than only ever sending the English version.
        if (fact.factTextRw) {
          lines.push(`     rw: ${fact.factTextRw}`);
        }
      });
    } else {
      lines.push("knowledge_facts: none found for this query");
    }

    if (params.weather) {
      lines.push(
        `weather_today (${params.weather.district}): ${params.weather.todayRainfallProbability}% chance of rain, ` +
          `${params.weather.todayRainfallMm}mm expected` +
          (params.weather.soilWorkable ? "" : ` — ${params.weather.soilWorkableReason ?? "avoid working the soil today"}`),
      );
    } else {
      lines.push("weather_today: not available (farmer's district not known yet, or the lookup failed)");
    }

    return lines;
  }

  private logLLMUsage(
    operation: string,
    model: string,
    inSize: number,
    outChars: number,
    latencyMs: number,
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined,
  ): void {
    this.logger.log(
      `${operation} [chat/${model}] ok — inSize=${inSize} outChars=${outChars} latencyMs=${latencyMs}` +
        (usage
          ? ` promptTokens=${usage.prompt_tokens} completionTokens=${usage.completion_tokens} totalTokens=${usage.total_tokens}`
          : ""),
    );
  }

  // `response_format: json_object` only guarantees syntactically valid JSON, not
  // our specific shape (tool-calling/schema-forcing reliability varies by model)
  // — so we validate the required field explicitly and fall back cleanly on any
  // mismatch rather than trusting partial/malformed content.
  private parseStructuredReply(rawText: string, language: ChatLanguage): StructuredReply {
    try {
      const parsed = JSON.parse(rawText);
      if (typeof parsed.replyText !== "string") {
        throw new Error("response JSON is missing a string replyText field");
      }

      // Only trust a crop slug that's actually one of the seeded ones, and
      // only trust either extraction field when BOTH are present and valid —
      // a crop without a date (or vice versa) isn't actionable, so treat a
      // partial extraction the same as no extraction at all.
      const rawCropSlug = typeof parsed.extractedCropSlug === "string" ? parsed.extractedCropSlug : null;
      const rawPlantingDate = typeof parsed.extractedPlantingDate === "string" ? parsed.extractedPlantingDate : null;
      const cropSlugValid = rawCropSlug !== null && (KNOWN_CROP_SLUGS as readonly string[]).includes(rawCropSlug);
      const plantingDateValid = rawPlantingDate !== null && ISO_DATE_RE.test(rawPlantingDate);
      const extractionComplete = cropSlugValid && plantingDateValid;

      return {
        replyText: parsed.replyText,
        suggestedChips: Array.isArray(parsed.suggestedChips)
          ? parsed.suggestedChips.filter((chip: unknown): chip is string => typeof chip === "string")
          : [],
        detectedTopics: Array.isArray(parsed.detectedTopics)
          ? parsed.detectedTopics.filter((topic: unknown): topic is string => typeof topic === "string")
          : [],
        extractedCropSlug: extractionComplete ? rawCropSlug : null,
        extractedPlantingDate: extractionComplete ? rawPlantingDate : null,
      };
    } catch (error) {
      this.logger.warn(`could not parse Groq JSON response — ${(error as Error).message}`);
      return this.fallbackReply(language);
    }
  }

  private fallbackReply(language: ChatLanguage): StructuredReply {
    return {
      replyText: FALLBACK_MESSAGES[language] ?? FALLBACK_MESSAGES.en,
      suggestedChips: [],
      detectedTopics: [],
      extractedCropSlug: null,
      extractedPlantingDate: null,
    };
  }
}

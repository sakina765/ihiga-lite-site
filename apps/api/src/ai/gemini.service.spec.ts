import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeminiService } from "./gemini.service";
import { SeasonInfo } from "../season/season.types";

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn(),
  SchemaType: { OBJECT: "OBJECT", STRING: "STRING", ARRAY: "ARRAY", NUMBER: "NUMBER", BOOLEAN: "BOOLEAN", INTEGER: "INTEGER" },
}));

function makeSeason(): SeasonInfo {
  return {
    code: "C",
    localName: "Impeshyi",
    englishName: "Season C (dry season / irrigated & marshland farming)",
    startDate: new Date(2026, 5, 16),
    endDate: new Date(2026, 8, 14),
  };
}

describe("GeminiService", () => {
  let sendMessageMock: jest.Mock;
  let service: GeminiService;

  beforeEach(() => {
    sendMessageMock = jest.fn();
    const startChatMock = jest.fn().mockReturnValue({ sendMessage: sendMessageMock });
    const getGenerativeModelMock = jest.fn().mockReturnValue({ startChat: startChatMock });

    (GoogleGenerativeAI as unknown as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: getGenerativeModelMock,
    }));

    const configService = { get: jest.fn().mockReturnValue("fake-key") } as unknown as ConfigService;
    service = new GeminiService(configService);
  });

  it("returns a parsed structured reply on success", async () => {
    sendMessageMock.mockResolvedValue({
      response: {
        text: () => JSON.stringify({ replyText: "Plant now", suggestedChips: ["When to water?"], detectedTopics: ["planting"] }),
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
      },
    });

    const result = await service.generateReply({
      userMessage: "When should I plant maize?",
      language: "en",
      season: makeSeason(),
      relevantFacts: [],
    });

    expect(result).toEqual({
      replyText: "Plant now",
      suggestedChips: ["When to water?"],
      detectedTopics: ["planting"],
    });
  });

  it("falls back to a language-appropriate message when Gemini returns malformed JSON", async () => {
    sendMessageMock.mockResolvedValue({ response: { text: () => "not json" } });

    const result = await service.generateReply({
      userMessage: "muraho",
      language: "rw",
      season: makeSeason(),
      relevantFacts: [],
    });

    expect(result.suggestedChips).toEqual([]);
    expect(result.detectedTopics).toEqual([]);
    expect(result.replyText).toContain("Mbabarira");
  });

  it("falls back gracefully when the Gemini call throws (e.g. rate limit / network failure)", async () => {
    sendMessageMock.mockRejectedValue(new Error("503 Service Unavailable"));

    const result = await service.generateReply({
      userMessage: "bonjour",
      language: "fr",
      season: makeSeason(),
      relevantFacts: [],
    });

    expect(result.suggestedChips).toEqual([]);
    expect(result.replyText).toContain("Désolé");
  });

  it("does not throw even when the schema is missing expected fields", async () => {
    sendMessageMock.mockResolvedValue({
      response: { text: () => JSON.stringify({ replyText: "ok" }) },
    });

    const result = await service.generateReply({
      userMessage: "hi",
      language: "en",
      season: makeSeason(),
      relevantFacts: [],
    });

    expect(result.replyText).toBe("ok");
    expect(result.suggestedChips).toEqual([]);
    expect(result.detectedTopics).toEqual([]);
  });
});

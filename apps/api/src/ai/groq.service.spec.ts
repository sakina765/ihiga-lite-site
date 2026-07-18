import { ConfigService } from "@nestjs/config";
import OpenAI, { toFile } from "openai";
import { GroqService } from "./groq.service";
import { SeasonInfo } from "../season/season.types";

jest.mock("openai", () => {
  const mockConstructor = jest.fn();
  return Object.assign(mockConstructor, { toFile: jest.fn() });
});

function makeSeason(): SeasonInfo {
  return {
    code: "C",
    localName: "Impeshyi",
    englishName: "Season C (dry season / irrigated & marshland farming)",
    startDate: new Date(2026, 5, 16),
    endDate: new Date(2026, 8, 14),
  };
}

describe("GroqService", () => {
  let createMock: jest.Mock;
  let transcriptionsCreateMock: jest.Mock;
  let service: GroqService;

  beforeEach(() => {
    createMock = jest.fn();
    transcriptionsCreateMock = jest.fn();
    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      chat: { completions: { create: createMock } },
      audio: { transcriptions: { create: transcriptionsCreateMock } },
    }));
    (toFile as jest.Mock).mockImplementation(async (buffer: Buffer, filename: string) => ({ buffer, filename }));

    const configService = { get: jest.fn().mockReturnValue("fake-key") } as unknown as ConfigService;
    service = new GroqService(configService);
  });

  it("returns a parsed structured reply on success", async () => {
    createMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({ replyText: "Plant now", suggestedChips: ["When to water?"], detectedTopics: ["planting"] }),
          },
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
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

  it("falls back to a language-appropriate message when Groq returns malformed JSON", async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: "not json" } }] });

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

  it("falls back gracefully when the Groq call throws (e.g. rate limit / network failure)", async () => {
    createMock.mockRejectedValue(new Error("429 Too Many Requests"));

    const result = await service.generateReply({
      userMessage: "bonjour",
      language: "fr",
      season: makeSeason(),
      relevantFacts: [],
    });

    expect(result.suggestedChips).toEqual([]);
    expect(result.replyText).toContain("Désolé");
  });

  it("defaults suggestedChips/detectedTopics to [] when only replyText is present", async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ replyText: "ok" }) } }] });

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

  it("falls back when the response is valid JSON but missing the required replyText field", async () => {
    // json_object mode only guarantees valid JSON syntax, not our schema —
    // this is the case that motivated stricter validation than the old Gemini path.
    createMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ suggestedChips: ["a"], detectedTopics: ["b"] }) } }],
    });

    const result = await service.generateReply({
      userMessage: "hi",
      language: "en",
      season: makeSeason(),
      relevantFacts: [],
    });

    expect(result.replyText).toContain("Sorry");
    expect(result.suggestedChips).toEqual([]);
  });

  it("passes conversation history mapped to OpenAI-style assistant/user roles", async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ replyText: "ok", suggestedChips: [], detectedTopics: [] }) } }],
    });

    await service.generateReply({
      userMessage: "and now?",
      language: "en",
      season: makeSeason(),
      relevantFacts: [],
      conversationHistory: [
        { role: "user", text: "hello" },
        { role: "model", text: "hi there" },
      ],
    });

    const call = createMock.mock.calls[0][0];
    expect(call.messages[0]).toEqual({ role: "system", content: expect.any(String) });
    expect(call.messages[1]).toEqual({ role: "user", content: "hello" });
    expect(call.messages[2]).toEqual({ role: "assistant", content: "hi there" });
    expect(call.response_format).toEqual({ type: "json_object" });
  });

  it("includes a knowledge fact's Kinyarwanda translation in the prompt when present, alongside the English text", async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ replyText: "ok", suggestedChips: [], detectedTopics: [] }) } }],
    });

    await service.generateReply({
      userMessage: "when should I harvest maize?",
      language: "rw",
      season: makeSeason(),
      relevantFacts: [
        {
          id: "fact-1",
          cropId: null,
          crop: null,
          topic: "harvest",
          factText: "Maize is ready when husks turn brown.",
          factTextRw: "Ibigori biba biteguye igihe amakoba yahindutse ibara ry'ikawa.",
          source: "RICA",
          tags: ["harvest", "maize"],
        },
      ],
    });

    const call = createMock.mock.calls[0][0];
    const userTurn = call.messages[call.messages.length - 1].content as string;
    expect(userTurn).toContain("Maize is ready when husks turn brown.");
    expect(userTurn).toContain("Ibigori biba biteguye igihe amakoba yahindutse ibara ry'ikawa.");
  });

  describe("transcribeAudio", () => {
    it("returns the transcribed text on success", async () => {
      transcriptionsCreateMock.mockResolvedValue({ text: "plant maize now" });

      const result = await service.transcribeAudio(Buffer.from("fake-audio-bytes"), "audio/webm");

      expect(result).toBe("plant maize now");
      expect(transcriptionsCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({ model: "whisper-large-v3" }),
        expect.any(Object),
      );
    });

    it("throws when the Groq call fails, leaving the error-response decision to the caller", async () => {
      transcriptionsCreateMock.mockRejectedValue(new Error("503 Service Unavailable"));

      await expect(service.transcribeAudio(Buffer.from("x"), "audio/webm")).rejects.toThrow("503 Service Unavailable");
    });
  });

  describe("analyzeImage", () => {
    it("returns a parsed structured reply and sends the image as a base64 data URL", async () => {
      createMock.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                replyText: "This could be leaf rust, but I'm not fully certain from the photo alone.",
                suggestedChips: ["Send another photo"],
                detectedTopics: ["disease"],
              }),
            },
          },
        ],
        usage: { prompt_tokens: 200, completion_tokens: 30, total_tokens: 230 },
      });

      const result = await service.analyzeImage(Buffer.from("fake-image-bytes"), "image/jpeg", {
        language: "en",
        season: makeSeason(),
        relevantFacts: [],
      });

      expect(result.replyText).toContain("not fully certain");
      const call = createMock.mock.calls[0][0];
      expect(call.model).toBe("meta-llama/llama-4-scout-17b-16e-instruct");
      expect(call.messages[0].role).toBe("system");
      expect(call.messages[1].content[1].type).toBe("image_url");
      expect(call.messages[1].content[1].image_url.url).toMatch(/^data:image\/jpeg;base64,/);
    });

    it("falls back gracefully when the vision call throws", async () => {
      createMock.mockRejectedValue(new Error("network error"));

      const result = await service.analyzeImage(Buffer.from("x"), "image/png", {
        language: "en",
        season: makeSeason(),
        relevantFacts: [],
      });

      expect(result.suggestedChips).toEqual([]);
      expect(result.replyText).toContain("Sorry");
    });
  });
});

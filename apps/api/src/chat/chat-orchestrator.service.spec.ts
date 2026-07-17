import { ChatOrchestratorService } from "./chat-orchestrator.service";
import { SeasonInfo } from "../season/season.types";

function makeSeason(): SeasonInfo {
  return {
    code: "C",
    localName: "Impeshyi",
    englishName: "Season C (dry season / irrigated & marshland farming)",
    startDate: new Date(2026, 5, 16),
    endDate: new Date(2026, 8, 14),
  };
}

describe("ChatOrchestratorService", () => {
  let conversationRepository: any;
  let messageRepository: any;
  let languageService: any;
  let seasonService: any;
  let cropsService: any;
  let knowledgeService: any;
  let geminiService: any;
  let service: ChatOrchestratorService;

  beforeEach(() => {
    conversationRepository = {
      create: jest.fn((data: any) => ({ id: undefined, language: null, cropId: null, plantingDate: null, ...data })),
      save: jest.fn(async (entity: any) => ({ ...entity, id: entity.id ?? "conv-1" })),
      findOne: jest.fn(),
    };
    messageRepository = {
      create: jest.fn((data: any) => ({ id: "msg-id", createdAt: new Date(), ...data })),
      save: jest.fn(async (entity: any) => entity),
      find: jest.fn(async () => []),
    };
    languageService = { detect: jest.fn(() => "en") };
    seasonService = { getCurrentSeason: jest.fn(() => makeSeason()) };
    cropsService = { getCurrentStage: jest.fn() };
    knowledgeService = { search: jest.fn(async () => []) };
    geminiService = {
      generateReply: jest.fn(async () => ({
        replyText: "Which crop did you plant, and when?",
        suggestedChips: ["Maize", "Beans", "Irish potato"],
        detectedTopics: [],
      })),
    };

    service = new ChatOrchestratorService(
      conversationRepository,
      messageRepository,
      languageService,
      seasonService,
      cropsService,
      knowledgeService,
      geminiService,
    );
  });

  it("starts a new conversation and asks a clarifying question when no crop is known", async () => {
    const result = await service.handleMessage({ message: "Hello, I need help with my farm" });

    expect(result.conversationId).toBe("conv-1");
    expect(result.cropStage).toBeUndefined();
    expect(result.replyText).toContain("Which crop");

    expect(cropsService.getCurrentStage).not.toHaveBeenCalled();
    expect(geminiService.generateReply).toHaveBeenCalledWith(
      expect.objectContaining({ cropStage: undefined, language: "en" }),
    );
    expect(messageRepository.save).toHaveBeenCalledTimes(2);
  });

  it("resolves and forwards the crop stage when cropId + plantingDate are known", async () => {
    cropsService.getCurrentStage.mockResolvedValue({
      id: "stage-1",
      cropId: "maize-id",
      name: "Vegetative growth",
      orderIndex: 4,
      weekStart: 6,
      weekEnd: 8,
      taskDescription: "Top-dress with nitrogen.",
      taskDescriptionRw: "Ongeraho ifumbire.",
    });

    const result = await service.handleMessage({
      message: "What should I do now?",
      cropId: "maize-id",
      plantingDate: "2026-05-01",
    });

    expect(cropsService.getCurrentStage).toHaveBeenCalledWith("maize-id", expect.any(Date));
    expect(result.cropStage).toEqual(
      expect.objectContaining({ name: "Vegetative growth", weekStart: 6, weekEnd: 8 }),
    );
    expect(geminiService.generateReply).toHaveBeenCalledWith(
      expect.objectContaining({
        cropStage: expect.objectContaining({ name: "Vegetative growth", weekStart: 6, weekEnd: 8 }),
      }),
    );
  });

  it("reuses an existing conversation's language and recent history instead of re-detecting", async () => {
    conversationRepository.findOne.mockResolvedValue({
      id: "conv-existing",
      language: "fr",
      cropId: null,
      plantingDate: null,
    });
    // Repository query orders DESC (most recent first); the service reverses it.
    messageRepository.find.mockResolvedValue([
      { role: "user", text: "Salut", createdAt: new Date(2026, 0, 2) },
      { role: "bot", text: "Bonjour", createdAt: new Date(2026, 0, 1) },
    ]);

    const result = await service.handleMessage({
      conversationId: "conv-existing",
      message: "Et maintenant?",
    });

    expect(result.conversationId).toBe("conv-existing");
    expect(languageService.detect).not.toHaveBeenCalled();
    expect(geminiService.generateReply).toHaveBeenCalledWith(
      expect.objectContaining({
        language: "fr",
        conversationHistory: [
          { role: "model", text: "Bonjour" },
          { role: "user", text: "Salut" },
        ],
      }),
    );
  });

  it("gives an explicit language override priority over the conversation's stored language", async () => {
    conversationRepository.findOne.mockResolvedValue({
      id: "conv-existing",
      language: "fr",
      cropId: null,
      plantingDate: null,
    });

    await service.handleMessage({
      conversationId: "conv-existing",
      message: "switch to english please",
      language: "en",
    });

    expect(geminiService.generateReply).toHaveBeenCalledWith(expect.objectContaining({ language: "en" }));
  });

  it("persists both the user message and the bot reply, in order", async () => {
    await service.handleMessage({ message: "Hi" });

    expect(messageRepository.save).toHaveBeenNthCalledWith(1, expect.objectContaining({ role: "user", text: "Hi" }));
    expect(messageRepository.save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ role: "bot", text: "Which crop did you plant, and when?" }),
    );
  });
});

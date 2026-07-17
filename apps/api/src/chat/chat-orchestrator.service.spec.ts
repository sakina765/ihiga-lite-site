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
  let groqService: any;
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
    groqService = {
      generateReply: jest.fn(async () => ({
        replyText: "Which crop did you plant, and when?",
        suggestedChips: ["Maize", "Beans", "Irish potato"],
        detectedTopics: [],
      })),
      analyzeImage: jest.fn(async () => ({
        replyText: "This could be pest damage, but I'm not fully certain from the photo alone.",
        suggestedChips: ["Send another photo"],
        detectedTopics: ["pest"],
      })),
    };

    service = new ChatOrchestratorService(
      conversationRepository,
      messageRepository,
      languageService,
      seasonService,
      cropsService,
      knowledgeService,
      groqService,
    );
  });

  it("starts a new conversation and asks a clarifying question when no crop is known", async () => {
    const result = await service.handleMessage({ message: "Hello, I need help with my farm" });

    expect(result.conversationId).toBe("conv-1");
    expect(result.cropStage).toBeUndefined();
    expect(result.replyText).toContain("Which crop");

    expect(cropsService.getCurrentStage).not.toHaveBeenCalled();
    expect(groqService.generateReply).toHaveBeenCalledWith(
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
    expect(groqService.generateReply).toHaveBeenCalledWith(
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
    expect(groqService.generateReply).toHaveBeenCalledWith(
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

    expect(groqService.generateReply).toHaveBeenCalledWith(expect.objectContaining({ language: "en" }));
  });

  it("persists both the user message and the bot reply, in order", async () => {
    await service.handleMessage({ message: "Hi" });

    expect(messageRepository.save).toHaveBeenNthCalledWith(1, expect.objectContaining({ role: "user", text: "Hi" }));
    expect(messageRepository.save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ role: "bot", text: "Which crop did you plant, and when?" }),
    );
  });

  it("defaults the persisted message type to 'text' and tags it 'voice' when told to", async () => {
    await service.handleMessage({ message: "Hi" });
    expect(messageRepository.create).toHaveBeenNthCalledWith(1, expect.objectContaining({ type: "text" }));

    await service.handleMessage({ message: "transcribed speech", messageType: "voice" });
    expect(messageRepository.create).toHaveBeenNthCalledWith(3, expect.objectContaining({ type: "voice" }));

    // Bot replies are always "text" regardless of what triggered them — the bot never sends voice/photos.
    expect(messageRepository.create).toHaveBeenNthCalledWith(2, expect.objectContaining({ role: "bot", type: "text" }));
    expect(messageRepository.create).toHaveBeenNthCalledWith(4, expect.objectContaining({ role: "bot", type: "text" }));
  });

  describe("handlePhotoMessage", () => {
    it("calls analyzeImage with the gathered context and persists a 'photo'-typed user message", async () => {
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
      const imageBuffer = Buffer.from("fake-image-bytes");

      const result = await service.handlePhotoMessage({
        imageBuffer,
        mimeType: "image/jpeg",
        caption: "What is wrong with these leaves?",
        cropId: "maize-id",
        plantingDate: "2026-05-01",
      });

      expect(groqService.analyzeImage).toHaveBeenCalledWith(
        imageBuffer,
        "image/jpeg",
        expect.objectContaining({
          language: "en",
          caption: "What is wrong with these leaves?",
          cropStage: expect.objectContaining({ name: "Vegetative growth" }),
        }),
      );
      expect(messageRepository.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ role: "user", type: "photo", text: "What is wrong with these leaves?" }),
      );
      expect(messageRepository.create).toHaveBeenNthCalledWith(2, expect.objectContaining({ role: "bot", type: "text" }));
      expect(result.replyText).toContain("not fully certain");
      expect(result.conversationId).toBe("conv-1");
    });

    it("uses a placeholder text when no caption is given", async () => {
      await service.handlePhotoMessage({ imageBuffer: Buffer.from("x"), mimeType: "image/png" });

      expect(messageRepository.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ role: "user", type: "photo", text: "[Photo shared]" }),
      );
    });

    it("still searches knowledge scoped to the crop when there's no caption to extract keywords from", async () => {
      await service.handlePhotoMessage({ imageBuffer: Buffer.from("x"), mimeType: "image/png", cropId: "maize-id" });

      expect(knowledgeService.search).toHaveBeenCalledWith("", "maize-id");
    });
  });
});

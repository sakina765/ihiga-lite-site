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

const FARMER_ID = "farmer-1";

describe("ChatOrchestratorService", () => {
  let conversationRepository: any;
  let messageRepository: any;
  let languageService: any;
  let seasonService: any;
  let cropsService: any;
  let cropSuggestionsService: any;
  let knowledgeService: any;
  let groqService: any;
  let farmersService: any;
  let weatherService: any;
  let service: ChatOrchestratorService;

  beforeEach(() => {
    conversationRepository = {
      create: jest.fn((data: any) => ({ id: undefined, language: null, farmerId: null, cropId: null, plantingDate: null, ...data })),
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
    cropsService.getCropBySlug = jest.fn(async (slug: string) => ({
      id: `${slug}-id`,
      slug,
      name: slug === "maize" ? "Maize" : "Beans",
      localName: slug === "maize" ? "Ibigori" : "Ibishyimbo",
      stages: [],
    }));
    farmersService = { getById: jest.fn(async () => ({ id: FARMER_ID, role: "farmer", district: null, preferredLanguage: null })) };
    weatherService = { getForecast: jest.fn() };
    cropSuggestionsService = { getSuggestions: jest.fn(() => ({ season: makeSeason(), province: null, crops: [] })) };

    service = new ChatOrchestratorService(
      conversationRepository,
      messageRepository,
      languageService,
      seasonService,
      cropsService,
      cropSuggestionsService,
      knowledgeService,
      groqService,
      farmersService,
      weatherService,
    );
  });

  it("starts a new conversation and asks a clarifying question when no crop is known", async () => {
    const result = await service.handleMessage({ farmerId: FARMER_ID, message: "Hello, I need help with my farm" });

    expect(result.conversationId).toBe("conv-1");
    expect(result.cropStage).toBeUndefined();
    expect(result.replyText).toContain("Which crop");

    expect(cropsService.getCurrentStage).not.toHaveBeenCalled();
    expect(groqService.generateReply).toHaveBeenCalledWith(
      expect.objectContaining({ cropStage: undefined, language: "en" }),
    );
    expect(messageRepository.save).toHaveBeenCalledTimes(2);
  });

  it("carries a farmer's already-tracked crop forward into a brand-new conversation (no conversationId)", async () => {
    // Regression: the frontend never persists conversationId across page
    // loads, so every fresh visit used to land on a blank conversation even
    // when the "Your crop" sidebar (backed by the same underlying data) knew
    // the farmer already had a tracked crop from an earlier conversation.
    conversationRepository.findOne.mockResolvedValue({
      id: "prior-conv",
      language: "en",
      farmerId: FARMER_ID,
      cropId: "maize-id",
      plantingDate: "2026-05-01",
    });
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

    const result = await service.handleMessage({ farmerId: FARMER_ID, message: "hey whats crops is mine" });

    expect(cropsService.getCurrentStage).toHaveBeenCalledWith("maize-id", expect.any(Date));
    expect(result.cropStage).toEqual(expect.objectContaining({ name: "Vegetative growth" }));
    expect(groqService.generateReply).toHaveBeenCalledWith(
      expect.objectContaining({ cropStage: expect.objectContaining({ name: "Vegetative growth" }) }),
    );
  });

  it("sets farmerId on the conversation", async () => {
    await service.handleMessage({ farmerId: FARMER_ID, message: "Hello" });

    expect(conversationRepository.save).toHaveBeenCalledWith(expect.objectContaining({ farmerId: FARMER_ID }));
  });

  describe("conversation ownership (Phase 10a #3 — conversation-hijack fix)", () => {
    const OTHER_FARMER_ID = "farmer-2";

    it("rejects a message sent with someone else's conversationId, and never reassigns or touches that conversation", async () => {
      // Farmer A's conversation — no pending crop proposal, so this exercises
      // the loadOrCreateConversation ownership check specifically.
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-existing",
        language: "en",
        farmerId: FARMER_ID,
        cropId: null,
        plantingDate: null,
      });

      // Farmer B (attacker) supplies farmer A's real conversationId with
      // their own farmerId — this used to silently reassign the
      // conversation's farmerId to the attacker (chat-orchestrator.service.ts's
      // prepareTurnContext unconditionally overwrote it), letting them then
      // read the victim's history via GET /chat/:id.
      await expect(
        service.handleMessage({ conversationId: "conv-existing", farmerId: OTHER_FARMER_ID, message: "hey" }),
      ).rejects.toThrow('No conversation found with id "conv-existing" for this farmer');

      // The rejection happens before any write — ownership is provably unchanged.
      expect(conversationRepository.save).not.toHaveBeenCalled();
      expect(groqService.generateReply).not.toHaveBeenCalled();
    });

    it("rejects a photo message sent with someone else's conversationId the same way", async () => {
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-existing",
        language: "en",
        farmerId: FARMER_ID,
        cropId: null,
        plantingDate: null,
      });

      await expect(
        service.handlePhotoMessage({
          conversationId: "conv-existing",
          farmerId: OTHER_FARMER_ID,
          imageBuffer: Buffer.from("x"),
          mimeType: "image/png",
        }),
      ).rejects.toThrow('No conversation found with id "conv-existing" for this farmer');

      expect(conversationRepository.save).not.toHaveBeenCalled();
      expect(groqService.analyzeImage).not.toHaveBeenCalled();
    });

    it("rejects confirming (or declining) another farmer's pending crop-tracking proposal via a hijacked conversationId", async () => {
      // Regression: resolvePendingCropConfirmation runs BEFORE
      // prepareTurnContext/loadOrCreateConversation in handleMessage, with
      // its own independent conversationId lookup — it used to have no
      // farmerId check at all, so an attacker with someone else's
      // conversationId could confirm/decline their pending crop proposal and
      // receive the resulting ChatResponse (crop stage, reply text, etc.).
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-existing",
        language: "en",
        farmerId: FARMER_ID,
        cropId: null,
        plantingDate: null,
        pendingCropSlug: "maize",
        pendingPlantingDate: "2026-03-01",
      });

      await expect(
        service.handleMessage({
          conversationId: "conv-existing",
          farmerId: OTHER_FARMER_ID,
          message: "Yes, track Maize (planted Mar 1)",
        }),
      ).rejects.toThrow('No conversation found with id "conv-existing" for this farmer');

      // Nothing about the victim's pending proposal was touched.
      expect(conversationRepository.save).not.toHaveBeenCalled();
    });

    it("still lets a conversation with no farmerId yet (legacy/unclaimed row) be adopted by whichever farmer sends to it first", async () => {
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-legacy",
        language: "en",
        farmerId: null,
        cropId: null,
        plantingDate: null,
      });

      const result = await service.handleMessage({
        conversationId: "conv-legacy",
        farmerId: FARMER_ID,
        message: "hello",
      });

      expect(result.conversationId).toBe("conv-legacy");
      expect(conversationRepository.save).toHaveBeenCalledWith(expect.objectContaining({ farmerId: FARMER_ID }));
    });
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
      farmerId: FARMER_ID,
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

  it("re-detects language from each new message rather than sticking with the conversation's stored language", async () => {
    conversationRepository.findOne.mockResolvedValue({
      id: "conv-existing",
      language: "en",
      farmerId: FARMER_ID,
      cropId: null,
      plantingDate: null,
    });
    // Repository query orders DESC (most recent first); the service reverses it.
    messageRepository.find.mockResolvedValue([
      { role: "user", text: "Hello", createdAt: new Date(2026, 0, 2) },
      { role: "bot", text: "Hi there", createdAt: new Date(2026, 0, 1) },
    ]);
    // A farmer who started in English switching to French mid-conversation —
    // Ihiga should follow along on this very message, not stay locked to "en".
    languageService.detect.mockReturnValue("fr");

    const result = await service.handleMessage({
      conversationId: "conv-existing",
      farmerId: FARMER_ID,
      message: "Et maintenant?",
    });

    expect(result.conversationId).toBe("conv-existing");
    expect(languageService.detect).toHaveBeenCalledWith("Et maintenant?");
    expect(groqService.generateReply).toHaveBeenCalledWith(
      expect.objectContaining({
        language: "fr",
        conversationHistory: [
          { role: "model", text: "Hi there" },
          { role: "user", text: "Hello" },
        ],
      }),
    );
  });

  it("keeps an established non-English conversation language when a later message has no confident signal", async () => {
    conversationRepository.findOne.mockResolvedValue({
      id: "conv-existing",
      language: "fr",
      farmerId: FARMER_ID,
      cropId: null,
      plantingDate: null,
    });
    // Mimics the real detector's behavior on an ambiguous message like "Riz" —
    // no fr/rw markers matched, so it falls back to "en" — which here should
    // read as "no signal", not "the farmer switched to English".
    languageService.detect.mockReturnValue("en");

    await service.handleMessage({ conversationId: "conv-existing", farmerId: FARMER_ID, message: "Riz" });

    expect(languageService.detect).toHaveBeenCalledWith("Riz");
    expect(groqService.generateReply).toHaveBeenCalledWith(expect.objectContaining({ language: "fr" }));
  });

  it("keeps the conversation's existing language when there's no text to detect from (e.g. an uncaptioned photo)", async () => {
    conversationRepository.findOne.mockResolvedValue({
      id: "conv-existing",
      language: "rw",
      farmerId: FARMER_ID,
      cropId: null,
      plantingDate: null,
    });

    await service.handlePhotoMessage({
      conversationId: "conv-existing",
      farmerId: FARMER_ID,
      imageBuffer: Buffer.from("fake-image-bytes"),
      mimeType: "image/jpeg",
    });

    expect(languageService.detect).not.toHaveBeenCalled();
    expect(groqService.analyzeImage).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ language: "rw" }),
    );
  });

  it("gives an explicit language override priority over the conversation's stored language", async () => {
    conversationRepository.findOne.mockResolvedValue({
      id: "conv-existing",
      language: "fr",
      farmerId: FARMER_ID,
      cropId: null,
      plantingDate: null,
    });

    await service.handleMessage({
      conversationId: "conv-existing",
      farmerId: FARMER_ID,
      message: "switch to english please",
      language: "en",
    });

    expect(groqService.generateReply).toHaveBeenCalledWith(expect.objectContaining({ language: "en" }));
  });

  describe("Phase 9: Farmer.preferredLanguage as the authoritative language baseline", () => {
    it("uses Farmer.preferredLanguage over LanguageService.detect() when the farmer sends an English message", async () => {
      farmersService.getById.mockResolvedValue({ id: FARMER_ID, role: "farmer", district: null, preferredLanguage: "rw" });
      languageService.detect.mockReturnValue("en");

      await service.handleMessage({ farmerId: FARMER_ID, message: "hello, how is my crop doing" });

      expect(groqService.generateReply).toHaveBeenCalledWith(expect.objectContaining({ language: "rw" }));
    });

    it("still lets a per-message explicit language override win over Farmer.preferredLanguage", async () => {
      farmersService.getById.mockResolvedValue({ id: FARMER_ID, role: "farmer", district: null, preferredLanguage: "rw" });

      await service.handleMessage({ farmerId: FARMER_ID, message: "switch to french please", language: "fr" });

      expect(groqService.generateReply).toHaveBeenCalledWith(expect.objectContaining({ language: "fr" }));
    });

    it("falls back to LanguageService.detect() when the farmer has no preferredLanguage set", async () => {
      farmersService.getById.mockResolvedValue({ id: FARMER_ID, role: "farmer", district: null, preferredLanguage: null });
      languageService.detect.mockReturnValue("fr");

      await service.handleMessage({ farmerId: FARMER_ID, message: "Bonjour, comment ça va?" });

      expect(languageService.detect).toHaveBeenCalledWith("Bonjour, comment ça va?");
      expect(groqService.generateReply).toHaveBeenCalledWith(expect.objectContaining({ language: "fr" }));
    });
  });

  it("persists both the user message and the bot reply, in order", async () => {
    await service.handleMessage({ farmerId: FARMER_ID, message: "Hi" });

    expect(messageRepository.save).toHaveBeenNthCalledWith(1, expect.objectContaining({ role: "user", text: "Hi" }));
    expect(messageRepository.save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ role: "bot", text: "Which crop did you plant, and when?" }),
    );
  });

  it("defaults the persisted message type to 'text' and tags it 'voice' when told to", async () => {
    await service.handleMessage({ farmerId: FARMER_ID, message: "Hi" });
    expect(messageRepository.create).toHaveBeenNthCalledWith(1, expect.objectContaining({ type: "text" }));

    await service.handleMessage({ farmerId: FARMER_ID, message: "transcribed speech", messageType: "voice" });
    expect(messageRepository.create).toHaveBeenNthCalledWith(3, expect.objectContaining({ type: "voice" }));

    // Bot replies are always "text" regardless of what triggered them — the bot never sends voice/photos.
    expect(messageRepository.create).toHaveBeenNthCalledWith(2, expect.objectContaining({ role: "bot", type: "text" }));
    expect(messageRepository.create).toHaveBeenNthCalledWith(4, expect.objectContaining({ role: "bot", type: "text" }));
  });

  describe("weather context", () => {
    it("looks up weather via the farmer's district and forwards it to generateReply", async () => {
      farmersService.getById.mockResolvedValue({ id: FARMER_ID, role: "farmer", district: "Musanze", preferredLanguage: null });
      const weather = { district: "Musanze", todayRainfallProbability: 80, todayRainfallMm: 15, soilWorkable: false, outlook: [], fetchedAt: "now" };
      weatherService.getForecast.mockResolvedValue(weather);

      await service.handleMessage({ farmerId: FARMER_ID, message: "Should I water today?" });

      expect(weatherService.getForecast).toHaveBeenCalledWith("Musanze");
      expect(groqService.generateReply).toHaveBeenCalledWith(expect.objectContaining({ weather }));
    });

    it("omits weather when the farmer has no district set", async () => {
      farmersService.getById.mockResolvedValue({ id: FARMER_ID, role: "farmer", district: null, preferredLanguage: null });

      await service.handleMessage({ farmerId: FARMER_ID, message: "Hi" });

      expect(weatherService.getForecast).not.toHaveBeenCalled();
      expect(groqService.generateReply).toHaveBeenCalledWith(expect.objectContaining({ weather: undefined }));
    });

    it("omits weather gracefully (rather than throwing) when the lookup fails", async () => {
      farmersService.getById.mockResolvedValue({ id: FARMER_ID, role: "farmer", district: "Musanze", preferredLanguage: null });
      weatherService.getForecast.mockRejectedValue(new Error("Open-Meteo down"));

      const result = await service.handleMessage({ farmerId: FARMER_ID, message: "Hi" });

      expect(result.conversationId).toBe("conv-1");
      expect(groqService.generateReply).toHaveBeenCalledWith(expect.objectContaining({ weather: undefined }));
    });
  });

  describe("farmerDistrictKnown", () => {
    // Regression: when weather/seasonalCrops came back empty for an unrelated
    // reason (transient lookup failure, or simply no seeded data), Groq had
    // no way to tell that apart from "district never given" — and would ask
    // the farmer to repeat information they'd already provided. This flag
    // lets GroqService's prompt draw that distinction (see groq.service.ts's
    // buildContextLines).
    it("is true even when weather/seasonalCrops still come back empty, as long as the farmer has a district", async () => {
      farmersService.getById.mockResolvedValue({ id: FARMER_ID, role: "farmer", district: "Musanze", preferredLanguage: null });
      weatherService.getForecast.mockRejectedValue(new Error("Open-Meteo down"));
      cropSuggestionsService.getSuggestions.mockReturnValue({ season: makeSeason(), province: "Northern", crops: [] });

      await service.handleMessage({ farmerId: FARMER_ID, message: "Hi" });

      expect(groqService.generateReply).toHaveBeenCalledWith(
        expect.objectContaining({ weather: undefined, seasonalCrops: undefined, farmerDistrictKnown: true }),
      );
    });

    it("is false when the farmer genuinely has no district set", async () => {
      farmersService.getById.mockResolvedValue({ id: FARMER_ID, role: "farmer", district: null, preferredLanguage: null });

      await service.handleMessage({ farmerId: FARMER_ID, message: "Hi" });

      expect(groqService.generateReply).toHaveBeenCalledWith(expect.objectContaining({ farmerDistrictKnown: false }));
    });

    it("is false when the farmer record itself isn't found", async () => {
      farmersService.getById.mockResolvedValue(null);

      await service.handleMessage({ farmerId: FARMER_ID, message: "Hi" });

      expect(groqService.generateReply).toHaveBeenCalledWith(expect.objectContaining({ farmerDistrictKnown: false }));
    });

    it("is forwarded to analyzeImage the same way for photo messages", async () => {
      farmersService.getById.mockResolvedValue({ id: FARMER_ID, role: "farmer", district: "Musanze", preferredLanguage: null });

      await service.handlePhotoMessage({ farmerId: FARMER_ID, imageBuffer: Buffer.from("x"), mimeType: "image/png" });

      expect(groqService.analyzeImage).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ farmerDistrictKnown: true }),
      );
    });
  });

  describe("crop auto-extraction propose/confirm/decline flow (Phase 8.2)", () => {
    it("proposes tracking (via confirm/deny chips) when Groq extracts a crop+date and no crop is tracked yet, without writing cropId/plantingDate", async () => {
      groqService.generateReply.mockResolvedValueOnce({
        replyText: "Got it, maize planted March 1st!",
        suggestedChips: ["Tell me more"],
        detectedTopics: [],
        extractedCropSlug: "maize",
        extractedPlantingDate: "2026-03-01",
      });

      const result = await service.handleMessage({
        farmerId: FARMER_ID,
        message: "I planted maize on March 1st, how's it doing?",
      });

      expect(result.pendingCropConfirmation).toEqual({
        cropSlug: "maize",
        cropName: "Maize",
        plantingDate: "2026-03-01",
      });
      expect(result.suggestedChips).toEqual(["Yes, track Maize (planted Mar 1)", "No, that's not right"]);
      expect(conversationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ pendingCropSlug: "maize", pendingPlantingDate: "2026-03-01" }),
      );
      // Not written to the real tracked-crop fields yet — only staged as pending.
      expect(conversationRepository.save).not.toHaveBeenCalledWith(expect.objectContaining({ cropId: "maize-id" }));
    });

    it("writes cropId/plantingDate for real when the farmer sends back the exact confirm chip text", async () => {
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-existing",
        language: "en",
        farmerId: FARMER_ID,
        cropId: null,
        plantingDate: null,
        pendingCropSlug: "maize",
        pendingPlantingDate: "2026-03-01",
      });
      cropsService.getCurrentStage.mockResolvedValue({
        id: "stage-1",
        cropId: "maize-id",
        name: "Germination",
        orderIndex: 1,
        weekStart: 0,
        weekEnd: 2,
        taskDescription: "Watch for even emergence.",
        taskDescriptionRw: "Reba niba byose byamerye neza.",
      });

      const result = await service.handleMessage({
        conversationId: "conv-existing",
        farmerId: FARMER_ID,
        message: "Yes, track Maize (planted Mar 1)",
      });

      expect(conversationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ cropId: "maize-id", plantingDate: "2026-03-01", pendingCropSlug: null, pendingPlantingDate: null }),
      );
      expect(result.pendingCropConfirmation).toBeUndefined();
      expect(result.cropStage).toEqual(expect.objectContaining({ name: "Germination" }));
      expect(result.replyText).toContain("Got it");
      // A confirm is resolved deterministically — no fresh Groq call needed.
      expect(groqService.generateReply).not.toHaveBeenCalled();
    });

    it("writes nothing when the farmer declines the proposal, and proceeds with a normal reply", async () => {
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-existing",
        language: "en",
        farmerId: FARMER_ID,
        cropId: null,
        plantingDate: null,
        pendingCropSlug: "maize",
        pendingPlantingDate: "2026-03-01",
      });

      const result = await service.handleMessage({
        conversationId: "conv-existing",
        farmerId: FARMER_ID,
        message: "No, that's not right",
      });

      expect(conversationRepository.save).not.toHaveBeenCalledWith(expect.objectContaining({ cropId: "maize-id" }));
      expect(conversationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ pendingCropSlug: null, pendingPlantingDate: null }),
      );
      // Falls through to a normal Groq-backed reply rather than getting stuck.
      expect(groqService.generateReply).toHaveBeenCalled();
      expect(result.pendingCropConfirmation).toBeUndefined();
    });

    it("does not immediately re-propose the same crop+date after a decline, even if Groq's next fallback reply re-extracts it", async () => {
      // Regression: found via live manual testing — declining fell through to
      // a normal Groq call, which (talking about the same recent message)
      // re-extracted the identical crop+date and re-proposed it in the very
      // same turn, reading as the bot ignoring the farmer's "no".
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-existing",
        language: "en",
        farmerId: FARMER_ID,
        cropId: null,
        plantingDate: null,
        pendingCropSlug: "maize",
        pendingPlantingDate: "2026-03-01",
        cropTrackingDeclined: false,
      });
      groqService.generateReply.mockResolvedValueOnce({
        replyText: "You mentioned maize planted March 1st...",
        suggestedChips: ["Tell me more"],
        detectedTopics: [],
        extractedCropSlug: "maize",
        extractedPlantingDate: "2026-03-01",
      });

      const result = await service.handleMessage({
        conversationId: "conv-existing",
        farmerId: FARMER_ID,
        message: "No, that's not right",
      });

      expect(conversationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ cropTrackingDeclined: true }),
      );
      expect(result.pendingCropConfirmation).toBeUndefined();
      expect(result.suggestedChips).toEqual(["Tell me more"]);
    });

    it("also writes nothing when the farmer sends something else entirely instead of confirming or declining", async () => {
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-existing",
        language: "en",
        farmerId: FARMER_ID,
        cropId: null,
        plantingDate: null,
        pendingCropSlug: "maize",
        pendingPlantingDate: "2026-03-01",
      });

      await service.handleMessage({
        conversationId: "conv-existing",
        farmerId: FARMER_ID,
        message: "actually what about my beans",
      });

      expect(conversationRepository.save).not.toHaveBeenCalledWith(expect.objectContaining({ cropId: "maize-id" }));
      expect(groqService.generateReply).toHaveBeenCalled();
    });

    it("does not re-propose crop tracking for a farmer who already has a tracked crop, even if Groq extracts a (different) crop+date in passing", async () => {
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-existing",
        language: "en",
        farmerId: FARMER_ID,
        cropId: "existing-crop-id",
        plantingDate: "2026-01-01",
        pendingCropSlug: null,
        pendingPlantingDate: null,
      });
      cropsService.getCurrentStage.mockResolvedValue({
        id: "stage-1",
        cropId: "existing-crop-id",
        name: "Vegetative growth",
        orderIndex: 4,
        weekStart: 6,
        weekEnd: 8,
        taskDescription: "Top-dress with nitrogen.",
        taskDescriptionRw: "Ongeraho ifumbire.",
      });
      groqService.generateReply.mockResolvedValueOnce({
        replyText: "Sounds like your beans are off to a good start too!",
        suggestedChips: ["Tell me more"],
        detectedTopics: [],
        extractedCropSlug: "beans",
        extractedPlantingDate: "2026-04-01",
      });

      const result = await service.handleMessage({
        conversationId: "conv-existing",
        farmerId: FARMER_ID,
        message: "oh by the way I also planted beans on April 1st",
      });

      expect(result.pendingCropConfirmation).toBeUndefined();
      expect(result.suggestedChips).toEqual(["Tell me more"]);
      expect(conversationRepository.save).not.toHaveBeenCalledWith(
        expect.objectContaining({ pendingCropSlug: "beans" }),
      );
    });
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
        farmerId: FARMER_ID,
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
      await service.handlePhotoMessage({ farmerId: FARMER_ID, imageBuffer: Buffer.from("x"), mimeType: "image/png" });

      expect(messageRepository.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ role: "user", type: "photo", text: "[Photo shared]" }),
      );
    });

    it("still searches knowledge scoped to the crop when there's no caption to extract keywords from", async () => {
      await service.handlePhotoMessage({
        farmerId: FARMER_ID,
        imageBuffer: Buffer.from("x"),
        mimeType: "image/png",
        cropId: "maize-id",
      });

      expect(knowledgeService.search).toHaveBeenCalledWith("", "maize-id");
    });
  });

  describe("getConversationHistory", () => {
    it("returns messages in ascending (oldest-first) order along with resolved season/cropStage", async () => {
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-existing",
        language: "fr",
        farmerId: FARMER_ID,
        cropId: "maize-id",
        plantingDate: "2026-05-01",
      });
      messageRepository.find.mockResolvedValue([
        { role: "user", type: "text", text: "Bonjour", createdAt: new Date(2026, 0, 1) },
        { role: "bot", type: "text", text: "Bonjour, comment puis-je vous aider?", createdAt: new Date(2026, 0, 2) },
      ]);
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

      const result = await service.getConversationHistory("conv-existing", FARMER_ID);

      expect(messageRepository.find).toHaveBeenCalledWith({
        where: { conversationId: "conv-existing" },
        order: { createdAt: "ASC" },
      });
      expect(result.conversationId).toBe("conv-existing");
      expect(result.language).toBe("fr");
      expect(result.cropStage).toEqual(expect.objectContaining({ name: "Vegetative growth" }));
      expect(result.messages).toEqual([
        expect.objectContaining({ role: "user", text: "Bonjour" }),
        expect.objectContaining({ role: "bot", text: "Bonjour, comment puis-je vous aider?" }),
      ]);
    });

    it("defaults language to 'en' when the conversation has none set", async () => {
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-existing",
        language: null,
        farmerId: FARMER_ID,
        cropId: null,
        plantingDate: null,
      });

      const result = await service.getConversationHistory("conv-existing", FARMER_ID);

      expect(result.language).toBe("en");
      expect(result.cropStage).toBeUndefined();
    });

    it("throws NotFoundException when the conversation doesn't exist", async () => {
      conversationRepository.findOne.mockResolvedValue(null);

      await expect(service.getConversationHistory("missing-conv", FARMER_ID)).rejects.toThrow(
        'No conversation found with id "missing-conv" for this farmer',
      );
      expect(messageRepository.find).not.toHaveBeenCalled();
    });

    it("throws NotFoundException (not a different error) when farmerId doesn't match the conversation's owner", async () => {
      // Deliberately indistinguishable from "doesn't exist" — a farmer probing
      // someone else's conversationId shouldn't be able to tell the difference
      // between "wrong owner" and "no such conversation".
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-existing",
        language: "en",
        farmerId: "some-other-farmer",
        cropId: null,
        plantingDate: null,
      });

      await expect(service.getConversationHistory("conv-existing", FARMER_ID)).rejects.toThrow(
        'No conversation found with id "conv-existing" for this farmer',
      );
      expect(messageRepository.find).not.toHaveBeenCalled();
    });
  });

  describe("deleteConversationMessages", () => {
    beforeEach(() => {
      messageRepository.delete = jest.fn(async () => ({ affected: 2 }));
    });

    it("deletes only the messages for that conversation, leaving the conversation row (and its tracked crop) intact", async () => {
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-existing",
        language: "en",
        farmerId: FARMER_ID,
        cropId: "maize-id",
        plantingDate: "2026-05-01",
      });

      await service.deleteConversationMessages("conv-existing", FARMER_ID);

      expect(messageRepository.delete).toHaveBeenCalledWith({ conversationId: "conv-existing" });
      expect(conversationRepository.save).not.toHaveBeenCalled();
    });

    it("throws NotFoundException when the conversation doesn't exist", async () => {
      conversationRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteConversationMessages("missing-conv", FARMER_ID)).rejects.toThrow(
        'No conversation found with id "missing-conv" for this farmer',
      );
      expect(messageRepository.delete).not.toHaveBeenCalled();
    });

    it("throws NotFoundException when farmerId doesn't match the conversation's owner", async () => {
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-existing",
        language: "en",
        farmerId: "some-other-farmer",
        cropId: null,
        plantingDate: null,
      });

      await expect(service.deleteConversationMessages("conv-existing", FARMER_ID)).rejects.toThrow(
        'No conversation found with id "conv-existing" for this farmer',
      );
      expect(messageRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("grounding data (retrievedFactIds)", () => {
    it("records which knowledge facts were retrieved on the bot's Message row, for a text reply", async () => {
      knowledgeService.search.mockResolvedValue([
        { id: "fact-1", topic: "harvest", factText: "...", tags: [] },
        { id: "fact-2", topic: "harvest", factText: "...", tags: [] },
      ]);

      await service.handleMessage({ farmerId: FARMER_ID, message: "when should I harvest maize?" });

      const botMessageCall = messageRepository.create.mock.calls.find((call: any[]) => call[0].role === "bot");
      expect(botMessageCall[0].retrievedFactIds).toEqual(["fact-1", "fact-2"]);
    });

    it("records an empty array (not null) when knowledge search ran but found nothing", async () => {
      knowledgeService.search.mockResolvedValue([]);

      await service.handleMessage({ farmerId: FARMER_ID, message: "hello" });

      const botMessageCall = messageRepository.create.mock.calls.find((call: any[]) => call[0].role === "bot");
      expect(botMessageCall[0].retrievedFactIds).toEqual([]);
    });

    it("records the same for a photo reply", async () => {
      // A caption is required here so searchKnowledge has terms to search on
      // at all — with neither a caption nor a tracked cropId, it correctly
      // short-circuits to [] without ever calling knowledgeService.search
      // (see "still searches knowledge scoped to the crop..." above).
      knowledgeService.search.mockResolvedValue([{ id: "fact-3", topic: "pest", factText: "...", tags: [] }]);

      await service.handlePhotoMessage({
        farmerId: FARMER_ID,
        imageBuffer: Buffer.from("x"),
        mimeType: "image/jpeg",
        caption: "my maize leaves look damaged",
      });

      const botMessageCall = messageRepository.create.mock.calls.find((call: any[]) => call[0].role === "bot");
      expect(botMessageCall[0].retrievedFactIds).toEqual(["fact-3"]);
    });

    it("records null (not applicable) for the deterministic tracking-confirmed reply, since it never runs a knowledge search", async () => {
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-existing",
        language: "en",
        farmerId: FARMER_ID,
        cropId: null,
        plantingDate: null,
        pendingCropSlug: "maize",
        pendingPlantingDate: "2026-06-01",
      });

      await service.handleMessage({
        conversationId: "conv-existing",
        farmerId: FARMER_ID,
        message: "Yes, track Maize (planted Jun 1)",
      });

      const botMessageCall = messageRepository.create.mock.calls.find((call: any[]) => call[0].role === "bot");
      expect(botMessageCall[0].retrievedFactIds).toBeNull();
    });
  });

  describe("deactivated farmer accounts", () => {
    beforeEach(() => {
      farmersService.getById.mockResolvedValue({
        id: FARMER_ID,
        role: "farmer",
        district: null,
        preferredLanguage: null,
        deactivatedAt: new Date("2026-01-01"),
      });
    });

    it("handleMessage returns a deactivation notice and never calls Groq", async () => {
      const result = await service.handleMessage({ farmerId: FARMER_ID, message: "hello" });

      expect(result.replyText).toContain("deleted");
      expect(groqService.generateReply).not.toHaveBeenCalled();
      // Still persists the farmer's message and a bot reply, same as any real turn.
      expect(messageRepository.save).toHaveBeenCalledTimes(2);
    });

    it("handlePhotoMessage returns a deactivation notice and never calls the vision model", async () => {
      const result = await service.handlePhotoMessage({
        farmerId: FARMER_ID,
        imageBuffer: Buffer.from("fake"),
        mimeType: "image/jpeg",
      });

      expect(result.replyText).toContain("deleted");
      expect(groqService.analyzeImage).not.toHaveBeenCalled();
    });

    it("even a pending crop-tracking confirmation is blocked for a deactivated account", async () => {
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-existing",
        language: "en",
        farmerId: FARMER_ID,
        cropId: null,
        plantingDate: null,
        pendingCropSlug: "maize",
        pendingPlantingDate: "2026-06-01",
      });

      const result = await service.handleMessage({
        conversationId: "conv-existing",
        farmerId: FARMER_ID,
        message: "Yes, track Maize (planted Jun 1)",
      });

      expect(result.replyText).toContain("deleted");
      // Never reached the pending-confirmation resolution path, let alone Groq.
      expect(groqService.generateReply).not.toHaveBeenCalled();
    });
  });

  describe("non-farmer role accounts", () => {
    beforeEach(() => {
      // registerOrFind refuses to hand out an admin's farmerId in the first
      // place — this covers one obtained some other way (e.g. cached before
      // the account was promoted to admin).
      farmersService.getById.mockResolvedValue({
        id: FARMER_ID,
        role: "admin",
        district: null,
        preferredLanguage: null,
        deactivatedAt: null,
      });
    });

    it("handleMessage returns the same blocked notice as a deactivated account, never calls Groq", async () => {
      const result = await service.handleMessage({ farmerId: FARMER_ID, message: "hello" });

      expect(result.replyText).toContain("deleted");
      expect(groqService.generateReply).not.toHaveBeenCalled();
    });
  });
});

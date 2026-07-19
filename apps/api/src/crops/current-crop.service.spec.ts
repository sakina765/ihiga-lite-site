import { NotFoundException } from "@nestjs/common";
import { CurrentCropService } from "./current-crop.service";

const FARMER_ID = "farmer-1";

describe("CurrentCropService", () => {
  let conversationRepository: any;
  let cropRepository: any;
  let cropsService: any;
  let service: CurrentCropService;

  const crop = { id: "maize-id", name: "Maize", localName: "Ibigori", slug: "maize", description: null, stages: [] };
  const stage = {
    id: "stage-1",
    cropId: "maize-id",
    name: "Vegetative growth",
    orderIndex: 4,
    weekStart: 6,
    weekEnd: 8,
    taskDescription: "Top-dress with nitrogen.",
    taskDescriptionRw: "Ongeraho ifumbire.",
  };

  beforeEach(() => {
    conversationRepository = {
      findOne: jest.fn(),
      create: jest.fn((data: any) => ({ id: undefined, ...data })),
      save: jest.fn(async (entity: any) => ({ ...entity, id: entity.id ?? "conv-new" })),
    };
    cropRepository = { findOne: jest.fn(async () => crop) };
    cropsService = { getCurrentStage: jest.fn(async () => stage) };
    service = new CurrentCropService(conversationRepository, cropRepository, cropsService);
  });

  describe("setForFarmer (manual fallback form)", () => {
    it("writes cropId/plantingDate directly onto the farmer's most recent conversation, no confirmation needed", async () => {
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-existing",
        farmerId: FARMER_ID,
        cropId: null,
        plantingDate: null,
      });

      const result = await service.setForFarmer(FARMER_ID, "maize-id", "2026-03-01");

      expect(conversationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: "conv-existing", cropId: "maize-id", plantingDate: "2026-03-01" }),
      );
      expect(result).toEqual({
        cropName: "Maize",
        localName: "Ibigori",
        stage: expect.objectContaining({ name: "Vegetative growth" }),
        plantingDate: "2026-03-01",
      });
    });

    it("creates a new conversation for a farmer who has never sent a chat message", async () => {
      conversationRepository.findOne.mockResolvedValue(null);

      await service.setForFarmer(FARMER_ID, "maize-id", "2026-03-01");

      expect(conversationRepository.create).toHaveBeenCalledWith(expect.objectContaining({ farmerId: FARMER_ID }));
      expect(conversationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ farmerId: FARMER_ID, cropId: "maize-id", plantingDate: "2026-03-01" }),
      );
    });

    it("throws NotFoundException for an unknown cropId", async () => {
      cropRepository.findOne.mockResolvedValue(null);

      await expect(service.setForFarmer(FARMER_ID, "unknown-id", "2026-03-01")).rejects.toThrow(NotFoundException);
      expect(conversationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("getForFarmer", () => {
    it("returns null when the farmer has no conversation with a tracked crop", async () => {
      conversationRepository.findOne.mockResolvedValue(null);
      const result = await service.getForFarmer(FARMER_ID);
      expect(result).toBeNull();
    });

    it("returns the crop/stage for the farmer's most recent tracked conversation", async () => {
      conversationRepository.findOne.mockResolvedValue({
        id: "conv-existing",
        farmerId: FARMER_ID,
        cropId: "maize-id",
        plantingDate: "2026-03-01",
      });

      const result = await service.getForFarmer(FARMER_ID);

      expect(result).toEqual({
        cropName: "Maize",
        localName: "Ibigori",
        stage: expect.objectContaining({ name: "Vegetative growth" }),
        plantingDate: "2026-03-01",
      });
    });
  });
});

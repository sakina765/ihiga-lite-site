import { NotFoundException } from "@nestjs/common";
import { CropsService } from "./crops.service";
import { Crop } from "./entities/crop.entity";
import { CropStage } from "./entities/crop-stage.entity";

function d(year: number, month1Indexed: number, day: number): Date {
  return new Date(year, month1Indexed - 1, day);
}

function makeStage(overrides: Partial<CropStage>): CropStage {
  return {
    id: "stage-id",
    cropId: "crop-id",
    crop: undefined as unknown as Crop,
    name: "Stage",
    orderIndex: 0,
    weekStart: 0,
    weekEnd: 0,
    taskDescription: "task",
    taskDescriptionRw: "task-rw",
    ...overrides,
  } as CropStage;
}

describe("CropsService", () => {
  let cropRepository: { findOne: jest.Mock; find: jest.Mock };
  let cropStageRepository: Record<string, jest.Mock>;
  let service: CropsService;

  const stages: CropStage[] = [
    makeStage({ id: "s1", name: "Land preparation", orderIndex: 1, weekStart: 0, weekEnd: 1 }),
    makeStage({ id: "s2", name: "Vegetative growth", orderIndex: 2, weekStart: 2, weekEnd: 5 }),
    makeStage({ id: "s3", name: "Harvest", orderIndex: 3, weekStart: 6, weekEnd: 8 }),
  ];

  const crop: Crop = {
    id: "crop-1",
    name: "Maize",
    localName: "Ibigori",
    slug: "maize",
    description: "desc",
    stages,
  };

  beforeEach(() => {
    cropRepository = { findOne: jest.fn(), find: jest.fn() };
    cropStageRepository = {};
    service = new CropsService(cropRepository as any, cropStageRepository as any);
  });

  describe("getCurrentStage", () => {
    it("returns the first stage at week 0 (planting day)", async () => {
      cropRepository.findOne.mockResolvedValue(crop);
      const plantingDate = d(2026, 1, 1);
      const referenceDate = d(2026, 1, 1);

      const result = await service.getCurrentStage("crop-1", plantingDate, referenceDate);
      expect(result.name).toBe("Land preparation");
    });

    it("returns the matching mid-stage a few weeks in", async () => {
      cropRepository.findOne.mockResolvedValue(crop);
      const plantingDate = d(2026, 1, 1);
      const referenceDate = d(2026, 1, 22); // 3 weeks later -> falls in weeks 2-5

      const result = await service.getCurrentStage("crop-1", plantingDate, referenceDate);
      expect(result.name).toBe("Vegetative growth");
    });

    it("returns the final stage when past the last stage's week range", async () => {
      cropRepository.findOne.mockResolvedValue(crop);
      const plantingDate = d(2026, 1, 1);
      const referenceDate = d(2026, 6, 1); // ~21 weeks later, well past week 8

      const result = await service.getCurrentStage("crop-1", plantingDate, referenceDate);
      expect(result.name).toBe("Harvest");
    });

    it("throws NotFoundException when the crop does not exist", async () => {
      cropRepository.findOne.mockResolvedValue(null);
      await expect(service.getCurrentStage("missing", d(2026, 1, 1))).rejects.toThrow(NotFoundException);
    });
  });

  describe("getCropBySlug", () => {
    it("returns the crop with stages sorted by orderIndex", async () => {
      const shuffled = { ...crop, stages: [stages[2], stages[0], stages[1]] };
      cropRepository.findOne.mockResolvedValue(shuffled);

      const result = await service.getCropBySlug("maize");
      expect(result.stages.map((s) => s.name)).toEqual(["Land preparation", "Vegetative growth", "Harvest"]);
    });

    it("throws NotFoundException for an unknown slug", async () => {
      cropRepository.findOne.mockResolvedValue(null);
      await expect(service.getCropBySlug("unknown")).rejects.toThrow(NotFoundException);
    });
  });

  describe("getAllCrops", () => {
    it("delegates to the repository", async () => {
      cropRepository.find.mockResolvedValue([crop]);
      const result = await service.getAllCrops();
      expect(result).toEqual([crop]);
      expect(cropRepository.find).toHaveBeenCalledWith({ order: { name: "ASC" } });
    });
  });
});

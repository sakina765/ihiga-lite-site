import { SectorsService } from "./sectors.service";

describe("SectorsService", () => {
  let sectorRepository: any;
  let farmerRepository: any;
  let service: SectorsService;

  beforeEach(() => {
    sectorRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      create: jest.fn((data: any) => data),
      save: jest.fn(async (entity: any) => ({ id: "new-id", ...entity })),
      delete: jest.fn(async () => ({ affected: 1 })),
    };
    farmerRepository = { count: jest.fn() };
    service = new SectorsService(sectorRepository, farmerRepository);
  });

  it("returns sectors for a district, sorted by name", async () => {
    sectorRepository.find.mockResolvedValue([{ id: "s1", name: "Kacyiru" }]);

    const result = await service.getByDistrict("Gasabo");

    expect(sectorRepository.find).toHaveBeenCalledWith({ where: { district: "Gasabo" }, order: { name: "ASC" } });
    expect(result).toEqual([{ id: "s1", name: "Kacyiru" }]);
  });

  it("finds a sector by id", async () => {
    sectorRepository.findOne.mockResolvedValue({ id: "s1" });

    const result = await service.getById("s1");

    expect(sectorRepository.findOne).toHaveBeenCalledWith({ where: { id: "s1" } });
    expect(result).toEqual({ id: "s1" });
  });

  it("finds the nearest sector via a distance-ordered query, scoped by the given coordinate", async () => {
    const nearest = { id: "s1", name: "Kacyiru", lat: -1.95, lng: 30.09 };
    const queryBuilder = {
      orderBy: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(nearest),
    };
    sectorRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const result = await service.findNearest(-1.94, 30.1);

    expect(queryBuilder.setParameters).toHaveBeenCalledWith({ lat: -1.94, lng: 30.1 });
    expect(queryBuilder.limit).toHaveBeenCalledWith(1);
    expect(result).toEqual(nearest);
  });

  it("returns null when no sector is seeded yet", async () => {
    const queryBuilder = {
      orderBy: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    sectorRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const result = await service.findNearest(0, 0);

    expect(result).toBeNull();
  });

  describe("admin CRUD (Phase 7)", () => {
    it("adminList scopes to a district when given, all sectors otherwise", async () => {
      sectorRepository.find.mockResolvedValue([]);

      await service.adminList("Musanze");
      expect(sectorRepository.find).toHaveBeenCalledWith({ where: { district: "Musanze" }, order: { district: "ASC", name: "ASC" } });

      await service.adminList();
      expect(sectorRepository.find).toHaveBeenCalledWith({ where: {}, order: { district: "ASC", name: "ASC" } });
    });

    it("create defaults coordinatesApproximated to true when not explicitly given", async () => {
      await service.create({ district: "Musanze", name: "Test Sector", lat: -1.5, lng: 29.6 });

      expect(sectorRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ coordinatesApproximated: true }),
      );
    });

    it("create respects an explicit coordinatesApproximated: false (a real surveyed coordinate)", async () => {
      await service.create({ district: "Musanze", name: "Test Sector", lat: -1.5, lng: 29.6, coordinatesApproximated: false });

      expect(sectorRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ coordinatesApproximated: false }),
      );
    });

    it("update only changes fields actually provided", async () => {
      sectorRepository.findOne.mockResolvedValue({
        id: "s1",
        district: "Musanze",
        name: "Old Name",
        nameRw: null,
        lat: -1.5,
        lng: 29.6,
        coordinatesApproximated: true,
      });

      const result = await service.update("s1", { lat: -1.501, lng: 29.601, coordinatesApproximated: false });

      expect(result.name).toBe("Old Name");
      expect(result.lat).toBe(-1.501);
      expect(result.coordinatesApproximated).toBe(false);
    });

    it("update throws NotFoundException for an unknown id", async () => {
      sectorRepository.findOne.mockResolvedValue(null);
      await expect(service.update("missing", { lat: 0, lng: 0 })).rejects.toThrow('No sector found with id "missing"');
    });

    it("delete throws NotFoundException when nothing was actually deleted", async () => {
      sectorRepository.delete.mockResolvedValue({ affected: 0 });
      await expect(service.delete("missing")).rejects.toThrow('No sector found with id "missing"');
    });

    it("getTrackingCount delegates to farmerRepository.count scoped by sectorId", async () => {
      farmerRepository.count.mockResolvedValue(3);

      const result = await service.getTrackingCount("s1");

      expect(farmerRepository.count).toHaveBeenCalledWith({ where: { sectorId: "s1" } });
      expect(result).toBe(3);
    });
  });
});

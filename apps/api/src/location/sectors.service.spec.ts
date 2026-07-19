import { SectorsService } from "./sectors.service";

describe("SectorsService", () => {
  let sectorRepository: any;
  let service: SectorsService;

  beforeEach(() => {
    sectorRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    service = new SectorsService(sectorRepository);
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
});

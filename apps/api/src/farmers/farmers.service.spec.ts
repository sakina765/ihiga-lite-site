import { FarmersService } from "./farmers.service";

describe("FarmersService", () => {
  let farmerRepository: any;
  let service: FarmersService;

  beforeEach(() => {
    farmerRepository = {
      findOne: jest.fn(),
      create: jest.fn((data: any) => ({ id: "new-farmer-id", ...data })),
      save: jest.fn(async (entity: any) => entity),
      find: jest.fn(async () => []),
    };
    service = new FarmersService(farmerRepository);
  });

  it("creates a new farmer with the normalized phone number when none exists", async () => {
    farmerRepository.findOne.mockResolvedValue(null);

    const farmer = await service.registerOrFind("0788123456", "Musanze");

    expect(farmerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ phoneNumber: "+250788123456", district: "Musanze" }),
    );
    expect(farmer.phoneNumber).toBe("+250788123456");
  });

  it("is idempotent — registering the same number twice returns the same farmer, not a duplicate", async () => {
    const existing = { id: "existing-id", phoneNumber: "+250788123456", district: "Musanze" };
    farmerRepository.findOne.mockResolvedValue(existing);

    const farmer = await service.registerOrFind("0788123456");

    expect(farmer.id).toBe("existing-id");
    expect(farmerRepository.create).not.toHaveBeenCalled();
  });

  it("recognizes different formats of the same number as the same farmer", async () => {
    const existing = { id: "existing-id", phoneNumber: "+250788123456", district: null };
    farmerRepository.findOne.mockResolvedValue(existing);

    await service.registerOrFind("+250 788 123 456");

    expect(farmerRepository.findOne).toHaveBeenCalledWith({ where: { phoneNumber: "+250788123456" } });
  });

  it("backfills district on an existing farmer who didn't have one yet", async () => {
    const existing = { id: "existing-id", phoneNumber: "+250788123456", district: null };
    farmerRepository.findOne.mockResolvedValue(existing);

    const farmer = await service.registerOrFind("0788123456", "Huye");

    expect(farmer.district).toBe("Huye");
    expect(farmerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ district: "Huye" }));
  });

  it("does not overwrite an existing farmer's district", async () => {
    const existing = { id: "existing-id", phoneNumber: "+250788123456", district: "Musanze" };
    farmerRepository.findOne.mockResolvedValue(existing);

    const farmer = await service.registerOrFind("0788123456", "Huye");

    expect(farmer.district).toBe("Musanze");
  });
});

import { FarmersService } from "./farmers.service";

describe("FarmersService", () => {
  let farmerRepository: any;
  let sectorsService: { getById: jest.Mock };
  let geocodingService: { resolveVillage: jest.Mock };
  let service: FarmersService;

  beforeEach(() => {
    farmerRepository = {
      findOne: jest.fn(),
      create: jest.fn((data: any) => ({ id: "new-farmer-id", ...data })),
      save: jest.fn(async (entity: any) => entity),
      find: jest.fn(async () => []),
    };
    sectorsService = { getById: jest.fn() };
    geocodingService = { resolveVillage: jest.fn() };
    service = new FarmersService(farmerRepository, sectorsService as any, geocodingService as any);
  });

  it("creates a new farmer with the normalized phone number when none exists", async () => {
    farmerRepository.findOne.mockResolvedValue(null);

    const farmer = await service.registerOrFind({ phoneNumber: "0788123456", district: "Musanze" });

    expect(farmerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ phoneNumber: "+250788123456", district: "Musanze" }),
    );
    expect(farmer.phoneNumber).toBe("+250788123456");
    expect(geocodingService.resolveVillage).not.toHaveBeenCalled();
  });

  it("is idempotent — registering the same number twice returns the same farmer, not a duplicate", async () => {
    const existing = { id: "existing-id", phoneNumber: "+250788123456", district: "Musanze" };
    farmerRepository.findOne.mockResolvedValue(existing);

    const farmer = await service.registerOrFind({ phoneNumber: "0788123456" });

    expect(farmer.id).toBe("existing-id");
    expect(farmerRepository.create).not.toHaveBeenCalled();
  });

  it("recognizes different formats of the same number as the same farmer", async () => {
    const existing = { id: "existing-id", phoneNumber: "+250788123456", district: null };
    farmerRepository.findOne.mockResolvedValue(existing);

    await service.registerOrFind({ phoneNumber: "+250 788 123 456" });

    expect(farmerRepository.findOne).toHaveBeenCalledWith({ where: { phoneNumber: "+250788123456" } });
  });

  it("backfills district on an existing farmer who didn't have one yet", async () => {
    const existing = { id: "existing-id", phoneNumber: "+250788123456", district: null };
    farmerRepository.findOne.mockResolvedValue(existing);

    const farmer = await service.registerOrFind({ phoneNumber: "0788123456", district: "Huye" });

    expect(farmer.district).toBe("Huye");
    expect(farmerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ district: "Huye" }));
  });

  it("does not overwrite an existing farmer's district", async () => {
    const existing = { id: "existing-id", phoneNumber: "+250788123456", district: "Musanze" };
    farmerRepository.findOne.mockResolvedValue(existing);

    const farmer = await service.registerOrFind({ phoneNumber: "0788123456", district: "Huye" });

    expect(farmer.district).toBe("Musanze");
  });

  describe("preferredLanguage (Phase 9)", () => {
    it("sets preferredLanguage on a newly created farmer", async () => {
      farmerRepository.findOne.mockResolvedValue(null);

      const farmer = await service.registerOrFind({ phoneNumber: "0788123456", preferredLanguage: "rw" });

      expect(farmerRepository.create).toHaveBeenCalledWith(expect.objectContaining({ preferredLanguage: "rw" }));
      expect(farmer.preferredLanguage).toBe("rw");
    });

    it("backfills preferredLanguage on an existing farmer who didn't have one yet", async () => {
      const existing = { id: "existing-id", phoneNumber: "+250788123456", district: "Musanze", preferredLanguage: null };
      farmerRepository.findOne.mockResolvedValue(existing);

      const farmer = await service.registerOrFind({ phoneNumber: "0788123456", preferredLanguage: "fr" });

      expect(farmer.preferredLanguage).toBe("fr");
      expect(farmerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ preferredLanguage: "fr" }));
    });

    it("does not overwrite an existing farmer's preferredLanguage on re-registration", async () => {
      const existing = { id: "existing-id", phoneNumber: "+250788123456", district: "Musanze", preferredLanguage: "rw" };
      farmerRepository.findOne.mockResolvedValue(existing);

      const farmer = await service.registerOrFind({ phoneNumber: "0788123456", preferredLanguage: "en" });

      expect(farmer.preferredLanguage).toBe("rw");
    });

    it("updatePreferredLanguage always overwrites, unlike registration's backfill-only behavior", async () => {
      const existing = { id: "existing-id", phoneNumber: "+250788123456", preferredLanguage: "rw" };
      farmerRepository.findOne.mockResolvedValue(existing);

      await service.updatePreferredLanguage("existing-id", "fr");

      expect(farmerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ preferredLanguage: "fr" }));
    });

    // Regression (Phase 10a #11): this used to throw NotFoundException,
    // giving a distinguishable signal (error vs success) that a nonexistent
    // farmerId was in fact nonexistent — a bare-id enumeration oracle with no
    // companion credential to legitimately check ownership against. Silently
    // no-opping instead means probing this method with a fake id is
    // indistinguishable from a real one from the caller's side.
    it("silently no-ops (does not throw, does not save) when the farmer doesn't exist", async () => {
      farmerRepository.findOne.mockResolvedValue(null);

      await expect(service.updatePreferredLanguage("missing-id", "en")).resolves.toBeUndefined();
      expect(farmerRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("getPreferredLanguage (Phase 10a #11 — anti-enumeration)", () => {
    it("returns the farmer's stored preference when one is set", async () => {
      farmerRepository.findOne.mockResolvedValue({ id: "existing-id", preferredLanguage: "rw" });

      await expect(service.getPreferredLanguage("existing-id")).resolves.toBe("rw");
    });

    it("returns null both when the farmer has no preference set and when the farmer doesn't exist at all — the two cases must be indistinguishable", async () => {
      farmerRepository.findOne.mockResolvedValueOnce({ id: "existing-id", preferredLanguage: null });
      await expect(service.getPreferredLanguage("existing-id")).resolves.toBeNull();

      farmerRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.getPreferredLanguage("missing-id")).resolves.toBeNull();
    });
  });

  describe("sector/village resolution", () => {
    it("resolves to the geocoded village coordinate when a confident match is found", async () => {
      farmerRepository.findOne.mockResolvedValue(null);
      geocodingService.resolveVillage.mockResolvedValue({ lat: -1.5, lng: 29.6 });
      sectorsService.getById.mockResolvedValue({ id: "sector-1", district: "Musanze", lat: -1.9, lng: 30.1 });

      const farmer = await service.registerOrFind({
        phoneNumber: "0788123456",
        sectorId: "sector-1",
        villageText: "Kabuga",
      });

      expect(geocodingService.resolveVillage).toHaveBeenCalledWith("sector-1", "Kabuga");
      expect(farmer.resolvedLatitude).toBe(-1.5);
      expect(farmer.resolvedLongitude).toBe(29.6);
      expect(farmer.sectorId).toBe("sector-1");
      expect(farmer.villageText).toBe("Kabuga");
    });

    it("falls back to the sector centroid when the village can't be geocoded", async () => {
      farmerRepository.findOne.mockResolvedValue(null);
      geocodingService.resolveVillage.mockResolvedValue(null);
      sectorsService.getById.mockResolvedValue({ id: "sector-1", district: "Musanze", lat: -1.9, lng: 30.1 });

      const farmer = await service.registerOrFind({
        phoneNumber: "0788123456",
        sectorId: "sector-1",
        villageText: "Nonexistent Place",
      });

      expect(farmer.resolvedLatitude).toBe(-1.9);
      expect(farmer.resolvedLongitude).toBe(30.1);
    });

    it("uses the sector centroid directly when no village text is given", async () => {
      farmerRepository.findOne.mockResolvedValue(null);
      sectorsService.getById.mockResolvedValue({ id: "sector-1", district: "Musanze", lat: -1.9, lng: 30.1 });

      const farmer = await service.registerOrFind({ phoneNumber: "0788123456", sectorId: "sector-1" });

      expect(geocodingService.resolveVillage).not.toHaveBeenCalled();
      expect(farmer.resolvedLatitude).toBe(-1.9);
      expect(farmer.villageText).toBeNull();
    });

    it("derives district from the chosen sector, even when the caller didn't also pass a district string", async () => {
      farmerRepository.findOne.mockResolvedValue(null);
      sectorsService.getById.mockResolvedValue({ id: "sector-1", district: "Musanze", lat: -1.9, lng: 30.1 });

      const farmer = await service.registerOrFind({ phoneNumber: "0788123456", sectorId: "sector-1" });

      expect(farmer.district).toBe("Musanze");
    });

    it("does not re-resolve sector fields for a farmer who already has a sector (backfill-only)", async () => {
      const existing = { id: "existing-id", phoneNumber: "+250788123456", district: "Musanze", sectorId: "already-set" };
      farmerRepository.findOne.mockResolvedValue(existing);

      await service.registerOrFind({ phoneNumber: "0788123456", sectorId: "sector-2", villageText: "Somewhere" });

      expect(geocodingService.resolveVillage).not.toHaveBeenCalled();
      expect(sectorsService.getById).not.toHaveBeenCalled();
      expect(farmerRepository.save).not.toHaveBeenCalled();
    });
  });
});

import { GeocodingService } from "./geocoding.service";
import { SectorsService } from "./sectors.service";

function mockNominatimResponse(results: { lat: string; lon: string }[]) {
  return { ok: true, status: 200, json: async () => results };
}

describe("GeocodingService", () => {
  let cacheRepository: any;
  let sectorsService: { getById: jest.Mock };
  let fetchMock: jest.Mock;
  let service: GeocodingService;

  const sector = { id: "sector-1", name: "Kimisagara", district: "Nyarugenge", lat: -1.98, lng: 30.03 };

  beforeEach(() => {
    cacheRepository = {
      findOne: jest.fn(),
      create: jest.fn((data: any) => data),
      save: jest.fn(async (entity: any) => entity),
    };
    sectorsService = { getById: jest.fn().mockResolvedValue(sector) };
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    service = new GeocodingService(cacheRepository, sectorsService as unknown as SectorsService);
  });

  it("queries Nominatim and caches the result on the first lookup", async () => {
    cacheRepository.findOne.mockResolvedValue(null);
    fetchMock.mockResolvedValue(mockNominatimResponse([{ lat: "-1.95", lon: "30.02" }]));

    const result = await service.resolveVillage("sector-1", "Kabuga");

    expect(result).toEqual({ lat: -1.95, lng: 30.02 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = fetchMock.mock.calls[0][0] as string;
    expect(requestedUrl).toContain("nominatim.openstreetmap.org");
    expect(requestedUrl).toContain("countrycodes=rw");
    expect(cacheRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ sectorId: "sector-1", villageText: "kabuga", found: true, resolvedLatitude: -1.95, resolvedLongitude: 30.02 }),
    );
  });

  it("never re-calls Nominatim for a village text already cached — served from the cache instead", async () => {
    cacheRepository.findOne.mockResolvedValue({
      sectorId: "sector-1",
      villageText: "kabuga",
      found: true,
      resolvedLatitude: -1.95,
      resolvedLongitude: 30.02,
    });

    const result = await service.resolveVillage("sector-1", "Kabuga");

    expect(result).toEqual({ lat: -1.95, lng: 30.02 });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sectorsService.getById).not.toHaveBeenCalled();
  });

  it("normalizes (trim + lowercase) village text before checking the cache, so casing/whitespace variants hit the same row", async () => {
    cacheRepository.findOne.mockResolvedValue({ sectorId: "sector-1", villageText: "kabuga", found: true, resolvedLatitude: -1.95, resolvedLongitude: 30.02 });

    await service.resolveVillage("sector-1", "  Kabuga  ");

    expect(cacheRepository.findOne).toHaveBeenCalledWith({ where: { sectorId: "sector-1", villageText: "kabuga" } });
  });

  it("permanently caches a not-found result too — a village Nominatim couldn't match isn't retried on every registration", async () => {
    cacheRepository.findOne.mockResolvedValue({ sectorId: "sector-1", villageText: "unknownplace", found: false, resolvedLatitude: null, resolvedLongitude: null });

    const result = await service.resolveVillage("sector-1", "UnknownPlace");

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null and caches a not-found row when Nominatim has no match", async () => {
    cacheRepository.findOne.mockResolvedValue(null);
    fetchMock.mockResolvedValue(mockNominatimResponse([]));

    const result = await service.resolveVillage("sector-1", "Nowhereville");

    expect(result).toBeNull();
    expect(cacheRepository.save).toHaveBeenCalledWith(expect.objectContaining({ found: false, resolvedLatitude: null, resolvedLongitude: null }));
  });

  it("returns null gracefully (never throws) when Nominatim errors, and still caches the miss", async () => {
    cacheRepository.findOne.mockResolvedValue(null);
    fetchMock.mockRejectedValue(new Error("network down"));

    const result = await service.resolveVillage("sector-1", "Kabuga");

    expect(result).toBeNull();
    expect(cacheRepository.save).toHaveBeenCalledWith(expect.objectContaining({ found: false }));
  });

  it("returns null gracefully when Nominatim responds with a non-OK status", async () => {
    cacheRepository.findOne.mockResolvedValue(null);
    fetchMock.mockResolvedValue({ ok: false, status: 503 });

    const result = await service.resolveVillage("sector-1", "Kabuga");

    expect(result).toBeNull();
  });

  it("returns null without calling Nominatim for blank village text", async () => {
    const result = await service.resolveVillage("sector-1", "   ");

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(cacheRepository.findOne).not.toHaveBeenCalled();
  });

  it("returns null when the sector itself doesn't exist", async () => {
    cacheRepository.findOne.mockResolvedValue(null);
    sectorsService.getById.mockResolvedValue(null);

    const result = await service.resolveVillage("missing-sector", "Kabuga");

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

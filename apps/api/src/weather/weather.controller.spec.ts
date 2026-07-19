import { WeatherController } from "./weather.controller";

describe("WeatherController", () => {
  let weatherService: { getForecast: jest.Mock; getForecastByCoordinates: jest.Mock };
  let farmersService: { getById: jest.Mock };
  let sectorsService: { getByDistrict: jest.Mock };
  let controller: WeatherController;

  beforeEach(() => {
    weatherService = { getForecast: jest.fn(), getForecastByCoordinates: jest.fn() };
    farmersService = { getById: jest.fn() };
    sectorsService = { getByDistrict: jest.fn() };
    controller = new WeatherController(weatherService as any, farmersService as any, sectorsService as any);
  });

  function makeWeather(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      district: "x",
      todayTemperatureC: 22,
      todayRainfallProbability: 10,
      todayRainfallMm: 0,
      soilWorkable: true,
      outlook: [],
      fetchedAt: "2026-07-18T00:00:00.000Z",
      ...overrides,
    };
  }

  describe("provinces", () => {
    it("omits a district whose forecast fetch fails, without failing the whole rollup", async () => {
      weatherService.getForecast.mockImplementation(async (district: string) => {
        if (district === "Kicukiro") {
          throw new Error("Open-Meteo down");
        }
        return makeWeather({ district });
      });

      const result = await controller.provinces();

      const kigaliCity = result.find((p) => p.province === "Kigali City")!;
      expect(kigaliCity.districts.map((d) => d.district)).not.toContain("Kicukiro");
      expect(kigaliCity.districts.map((d) => d.district)).toContain("Gasabo");
      expect(kigaliCity.districts.map((d) => d.district)).toContain("Nyarugenge");
    });

    it("returns every district when nothing fails", async () => {
      weatherService.getForecast.mockImplementation(async (district: string) => makeWeather({ district }));

      const result = await controller.provinces();

      const totalDistricts = result.reduce((sum, p) => sum + p.districts.length, 0);
      expect(totalDistricts).toBe(30);
    });
  });

  describe("sectors", () => {
    it("omits a sector whose forecast fetch fails, without failing the whole drill-down", async () => {
      sectorsService.getByDistrict.mockResolvedValue([
        { id: "s1", name: "Busogo", nameRw: null, lat: -1.4, lng: 29.6 },
        { id: "s2", name: "Cyuve", nameRw: null, lat: -1.45, lng: 29.65 },
      ]);
      weatherService.getForecastByCoordinates.mockImplementation(async (_lat: number, _lng: number, name: string) => {
        if (name === "Cyuve") {
          throw new Error("Open-Meteo down");
        }
        return makeWeather({ district: name });
      });

      const result = await controller.sectors({ district: "Musanze" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Busogo");
    });
  });
});

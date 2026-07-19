import { WeatherService } from "./weather.service";

function mockOpenMeteoResponse(overrides: { probabilities?: number[]; sums?: number[]; temperatures?: number[] } = {}) {
  const probabilities = overrides.probabilities ?? [10, 20, 30, 15, 5];
  const sums = overrides.sums ?? [0, 1.2, 2.5, 0.4, 0];
  const temperatures = overrides.temperatures ?? [22.4, 23.1, 21.8, 20.9, 22.0];
  return {
    ok: true,
    status: 200,
    json: async () => ({
      daily: {
        time: ["2026-07-17", "2026-07-18", "2026-07-19", "2026-07-20", "2026-07-21"],
        precipitation_probability_max: probabilities,
        precipitation_sum: sums,
        temperature_2m_max: temperatures,
      },
    }),
  };
}

describe("WeatherService", () => {
  let service: WeatherService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    service = new WeatherService();
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("returns parsed forecast data for a known district", async () => {
    fetchMock.mockResolvedValue(mockOpenMeteoResponse());

    const result = await service.getForecast("Musanze");

    expect(result.district).toBe("Musanze");
    expect(result.todayTemperatureC).toBe(22);
    expect(result.todayRainfallProbability).toBe(10);
    expect(result.todayRainfallMm).toBe(0);
    expect(result.soilWorkable).toBe(true);
    expect(result.outlook).toHaveLength(5);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = fetchMock.mock.calls[0][0] as string;
    expect(requestedUrl).toContain("api.open-meteo.com");
    expect(requestedUrl).toContain("latitude=-1.4995");
  });

  it("rounds today's temperature to the nearest whole degree", async () => {
    fetchMock.mockResolvedValue(mockOpenMeteoResponse({ temperatures: [22.6, 23.1, 21.8, 20.9, 22.0] }));

    const result = await service.getForecast("Musanze");

    expect(result.todayTemperatureC).toBe(23);
  });

  it("flags soil as not workable when today's rainfall is heavy", async () => {
    fetchMock.mockResolvedValue(mockOpenMeteoResponse({ sums: [15, 1.2, 2.5, 0.4, 0] }));

    const result = await service.getForecast("Musanze");

    expect(result.soilWorkable).toBe(false);
    expect(result.soilWorkableReason).toBeTruthy();
  });

  it("flags soil as not workable when today's rain probability is high, even with low mm", async () => {
    fetchMock.mockResolvedValue(mockOpenMeteoResponse({ probabilities: [85, 20, 30, 15, 5], sums: [1, 1.2, 2.5, 0.4, 0] }));

    const result = await service.getForecast("Musanze");

    expect(result.soilWorkable).toBe(false);
  });

  it("caches the result and does not re-fetch within the TTL", async () => {
    fetchMock.mockResolvedValue(mockOpenMeteoResponse());

    await service.getForecast("Kigali");
    await service.getForecast("Kigali");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws for a district with no configured coordinates", async () => {
    await expect(service.getForecast("Nonexistent District")).rejects.toThrow(/Weather unavailable/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when Open-Meteo responds with a non-OK status", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    await expect(service.getForecast("Kigali")).rejects.toThrow(/status 500/);
  });
});

import { weatherIconEmoji } from "./WeatherIcon";

describe("weatherIconEmoji", () => {
  it("picks the sun emoji when soil is workable", () => {
    expect(weatherIconEmoji({ soilWorkable: true })).toBe("☀️");
  });

  it("picks the rain-cloud emoji when soil is not workable", () => {
    expect(weatherIconEmoji({ soilWorkable: false })).toBe("🌧️");
  });
});

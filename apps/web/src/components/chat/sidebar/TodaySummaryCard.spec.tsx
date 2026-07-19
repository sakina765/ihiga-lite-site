import { render, screen } from "@testing-library/react";
import type { CurrentCropResponse, WeatherInfo } from "@ihiga-lite/shared";
import { buildSummaryLines, TodaySummaryCard } from "./TodaySummaryCard";

const weather: WeatherInfo = {
  district: "Musanze",
  todayTemperatureC: 22,
  todayRainfallProbability: 33,
  todayRainfallMm: 2,
  soilWorkable: true,
  outlook: [],
  fetchedAt: "2026-07-18T00:00:00.000Z",
};

const heavyRainWeather: WeatherInfo = {
  ...weather,
  soilWorkable: false,
  soilWorkableReason: "Heavy rain expected today — wait before working the soil.",
};

const crop: CurrentCropResponse = {
  cropName: "Maize",
  localName: "Ibigori",
  stage: { name: "Tasseling", weekStart: 6, weekEnd: 8, taskDescription: "prioritize irrigation this week", taskDescriptionRw: "" },
  plantingDate: "2026-06-01",
};

describe("buildSummaryLines", () => {
  it("combines both lines when weather and crop are both present", () => {
    const { weatherLine, cropLine } = buildSummaryLines(weather, crop);

    expect(weatherLine).toBe("33% chance of rain — good day to work the soil.");
    expect(cropLine).toBe("Your maize is in the tasseling stage — prioritize irrigation this week");
  });

  it("uses the soil-risk reason when soil isn't workable", () => {
    const { weatherLine } = buildSummaryLines(heavyRainWeather, null);

    expect(weatherLine).toBe("33% chance of rain — Heavy rain expected today — wait before working the soil.");
  });

  it("shows only the weather half, with a calm crop prompt, when no crop is tracked", () => {
    const { weatherLine, cropLine } = buildSummaryLines(weather, null);

    expect(weatherLine).toBe("33% chance of rain — good day to work the soil.");
    expect(cropLine).toBe("Tell Ihiga your crop and planting date in chat to see this week's task here.");
  });

  it("does not crash when crop is present but weather is not (shouldn't really happen)", () => {
    const { weatherLine, cropLine } = buildSummaryLines(null, crop);

    expect(weatherLine).toBeNull();
    expect(cropLine).toContain("maize");
  });

  it("degrades sensibly when neither weather nor crop is available", () => {
    const { weatherLine, cropLine } = buildSummaryLines(null, null);

    expect(weatherLine).toBeNull();
    expect(cropLine).toBe("Tell Ihiga your crop and planting date in chat to see this week's task here.");
  });
});

describe("TodaySummaryCard", () => {
  it("renders a loading state while either weather or crop is still loading", () => {
    render(<TodaySummaryCard weatherData={null} weatherLoading={true} weatherError={false} cropData={null} cropLoading={false} />);

    expect(screen.getByText(/loading today's summary/i)).toBeInTheDocument();
  });

  it("renders both headline lines once loaded", () => {
    render(<TodaySummaryCard weatherData={weather} weatherLoading={false} weatherError={false} cropData={crop} cropLoading={false} />);

    expect(screen.getByText(/33% chance of rain/i)).toBeInTheDocument();
    expect(screen.getByText(/tasseling stage/i)).toBeInTheDocument();
  });

  it("shows an unavailable message (not the no-district prompt) when the weather request errored", () => {
    render(<TodaySummaryCard weatherData={null} weatherLoading={false} weatherError={true} cropData={null} cropLoading={false} />);

    expect(screen.getByText(/weather unavailable right now/i)).toBeInTheDocument();
  });
});

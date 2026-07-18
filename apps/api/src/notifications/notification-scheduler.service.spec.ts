import { NotificationSchedulerService } from "./notification-scheduler.service";

function makeFarmer(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "farmer-1",
    phoneNumber: "+250788123456",
    district: "Musanze",
    preferredLanguage: "en",
    lastNotifiedStageId: null,
    lastNotifiedWeatherAlertDate: null,
    ...overrides,
  };
}

function makeStage(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "stage-1",
    name: "Tasseling & flowering",
    weekStart: 9,
    weekEnd: 10,
    taskDescription: "Ensure adequate moisture.",
    taskDescriptionRw: "Reba neza ko hari amazi ahagije.",
    ...overrides,
  };
}

function makeWeather(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    district: "Musanze",
    todayRainfallProbability: 10,
    todayRainfallMm: 0,
    soilWorkable: true,
    outlook: [],
    fetchedAt: "now",
    ...overrides,
  };
}

describe("NotificationSchedulerService", () => {
  let farmerRepository: any;
  let conversationRepository: any;
  let cropsService: any;
  let weatherService: any;
  let smsService: any;
  let service: NotificationSchedulerService;

  beforeEach(() => {
    farmerRepository = {
      find: jest.fn(async () => []),
      save: jest.fn(async (entity: any) => entity),
    };
    conversationRepository = { findOne: jest.fn() };
    cropsService = { getCurrentStage: jest.fn() };
    weatherService = { getForecast: jest.fn() };
    smsService = { sendSms: jest.fn(async () => undefined) };

    service = new NotificationSchedulerService(farmerRepository, conversationRepository, cropsService, weatherService, smsService);
  });

  it("skips a farmer with no active crop/planting date on record", async () => {
    const farmer = makeFarmer();
    farmerRepository.find.mockResolvedValue([farmer]);
    conversationRepository.findOne.mockResolvedValue(null);

    const results = await service.runDailyNotifications();

    expect(results).toEqual([{ farmerId: "farmer-1", outcome: "skipped", reason: expect.stringContaining("no active crop") }]);
    expect(smsService.sendSms).not.toHaveBeenCalled();
  });

  it("sends an SMS and records the new stage when the crop stage has changed", async () => {
    const farmer = makeFarmer({ lastNotifiedStageId: "old-stage-id" });
    farmerRepository.find.mockResolvedValue([farmer]);
    conversationRepository.findOne.mockResolvedValue({ cropId: "maize-id", plantingDate: "2026-05-01" });
    cropsService.getCurrentStage.mockResolvedValue(makeStage({ id: "new-stage-id" }));
    weatherService.getForecast.mockResolvedValue(makeWeather());

    const results = await service.runDailyNotifications();

    expect(smsService.sendSms).toHaveBeenCalledWith("+250788123456", expect.stringContaining("Tasseling & flowering"));
    expect(farmerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ lastNotifiedStageId: "new-stage-id" }));
    expect(results[0].outcome).toBe("sent");
  });

  it("does not re-notify the same stage twice", async () => {
    const farmer = makeFarmer({ lastNotifiedStageId: "current-stage-id" });
    farmerRepository.find.mockResolvedValue([farmer]);
    conversationRepository.findOne.mockResolvedValue({ cropId: "maize-id", plantingDate: "2026-05-01" });
    cropsService.getCurrentStage.mockResolvedValue(makeStage({ id: "current-stage-id" }));
    weatherService.getForecast.mockResolvedValue(makeWeather({ soilWorkable: true }));

    const results = await service.runDailyNotifications();

    expect(smsService.sendSms).not.toHaveBeenCalled();
    expect(results[0].outcome).toBe("skipped");
  });

  it("sends a weather-risk SMS when the soil isn't workable and no alert has gone out today", async () => {
    const farmer = makeFarmer({ lastNotifiedStageId: "current-stage-id" });
    farmerRepository.find.mockResolvedValue([farmer]);
    conversationRepository.findOne.mockResolvedValue({ cropId: "maize-id", plantingDate: "2026-05-01" });
    cropsService.getCurrentStage.mockResolvedValue(makeStage({ id: "current-stage-id" }));
    weatherService.getForecast.mockResolvedValue(makeWeather({ soilWorkable: false, soilWorkableReason: "Heavy rain" }));

    const results = await service.runDailyNotifications();

    expect(smsService.sendSms).toHaveBeenCalledWith("+250788123456", expect.stringContaining("rain"));
    expect(farmerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ lastNotifiedWeatherAlertDate: expect.any(String) }));
    expect(results[0].outcome).toBe("sent");
  });

  it("does not re-send a weather alert already sent today", async () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const farmer = makeFarmer({ lastNotifiedStageId: "current-stage-id", lastNotifiedWeatherAlertDate: todayStr });
    farmerRepository.find.mockResolvedValue([farmer]);
    conversationRepository.findOne.mockResolvedValue({ cropId: "maize-id", plantingDate: "2026-05-01" });
    cropsService.getCurrentStage.mockResolvedValue(makeStage({ id: "current-stage-id" }));
    weatherService.getForecast.mockResolvedValue(makeWeather({ soilWorkable: false }));

    const results = await service.runDailyNotifications();

    expect(smsService.sendSms).not.toHaveBeenCalled();
    expect(results[0].outcome).toBe("skipped");
  });

  it("skips farmers with no district for the weather-risk check but still checks stage change", async () => {
    const farmer = makeFarmer({ district: null, lastNotifiedStageId: "old-stage-id" });
    farmerRepository.find.mockResolvedValue([farmer]);
    conversationRepository.findOne.mockResolvedValue({ cropId: "maize-id", plantingDate: "2026-05-01" });
    cropsService.getCurrentStage.mockResolvedValue(makeStage({ id: "new-stage-id" }));

    const results = await service.runDailyNotifications();

    expect(weatherService.getForecast).not.toHaveBeenCalled();
    expect(results[0].outcome).toBe("sent");
  });

  it("never crashes the batch — a farmer whose evaluation throws is marked 'failed', others still run", async () => {
    const brokenFarmer = makeFarmer({ id: "broken-farmer" });
    const okFarmer = makeFarmer({ id: "ok-farmer", lastNotifiedStageId: "old-stage-id" });
    farmerRepository.find.mockResolvedValue([brokenFarmer, okFarmer]);

    conversationRepository.findOne.mockImplementation(async (query: any) => {
      if (query.where.farmerId === "broken-farmer") {
        throw new Error("DB exploded");
      }
      return { cropId: "maize-id", plantingDate: "2026-05-01" };
    });
    cropsService.getCurrentStage.mockResolvedValue(makeStage({ id: "new-stage-id" }));
    weatherService.getForecast.mockResolvedValue(makeWeather());

    const results = await service.runDailyNotifications();

    expect(results).toHaveLength(2);
    expect(results.find((r) => r.farmerId === "broken-farmer")?.outcome).toBe("failed");
    expect(results.find((r) => r.farmerId === "ok-farmer")?.outcome).toBe("sent");
  });

  it("does not throw even when SmsService itself would (defensive — SmsService is designed to never throw)", async () => {
    const farmer = makeFarmer({ lastNotifiedStageId: "old-stage-id" });
    farmerRepository.find.mockResolvedValue([farmer]);
    conversationRepository.findOne.mockResolvedValue({ cropId: "maize-id", plantingDate: "2026-05-01" });
    cropsService.getCurrentStage.mockResolvedValue(makeStage({ id: "new-stage-id" }));
    weatherService.getForecast.mockResolvedValue(makeWeather());
    smsService.sendSms.mockRejectedValue(new Error("unexpected sms error"));

    const results = await service.runDailyNotifications();

    expect(results[0].outcome).toBe("failed");
  });
});

import { INestApplication, ValidationPipe } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { ThrottlerModule } from "@nestjs/throttler";
import request from "supertest";
import { FarmersController } from "./farmers.controller";
import { FarmersService } from "./farmers.service";
import { AppThrottlerGuard } from "../common/app-throttler.guard";

describe("FarmersController", () => {
  let app: INestApplication;
  let farmersService: { registerOrFind: jest.Mock; updatePreferredLanguage: jest.Mock; getPreferredLanguage: jest.Mock };

  beforeEach(async () => {
    farmersService = {
      registerOrFind: jest.fn(async (params: { phoneNumber: string; district?: string; preferredLanguage?: string }) => ({
        id: "33333333-3333-4333-8333-333333333333",
        phoneNumber: params.phoneNumber,
        district: params.district ?? null,
        sectorId: null,
        villageText: null,
        resolvedLatitude: null,
        resolvedLongitude: null,
        preferredLanguage: params.preferredLanguage ?? null,
      })),
      updatePreferredLanguage: jest.fn(async () => undefined),
      getPreferredLanguage: jest.fn(async () => "rw"),
    };

    const moduleRef = await Test.createTestingModule({
      // Real ThrottlerModule + AppThrottlerGuard so the @Throttle({default: {limit: 5, ...}})
      // on POST /farmers/register actually applies here, exactly like in the running app.
      imports: [ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 20 }])],
      controllers: [FarmersController],
      providers: [
        { provide: FarmersService, useValue: farmersService },
        { provide: APP_GUARD, useClass: AppThrottlerGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("registers a farmer with a valid phone number", async () => {
    const response = await request(app.getHttpServer()).post("/farmers/register").send({ phoneNumber: "0788123456" }).expect(201);

    expect(farmersService.registerOrFind).toHaveBeenCalledWith({
      phoneNumber: "0788123456",
      district: undefined,
      latitude: undefined,
      longitude: undefined,
      sectorId: undefined,
      villageText: undefined,
      preferredLanguage: undefined,
    });
    expect(response.body).toEqual({
      farmerId: "33333333-3333-4333-8333-333333333333",
      phoneNumber: "0788123456",
      district: null,
      preferredLanguage: null,
      latitude: undefined,
      longitude: undefined,
      sectorId: null,
      villageText: null,
      resolvedLatitude: null,
      resolvedLongitude: null,
    });
  });

  it("registers a farmer via the cascading picker's sectorId + villageText", async () => {
    const response = await request(app.getHttpServer())
      .post("/farmers/register")
      .send({ phoneNumber: "0788123456", sectorId: "11111111-1111-4111-8111-111111111111", villageText: "  Kabuga  " })
      .expect(201);

    expect(farmersService.registerOrFind).toHaveBeenCalledWith(
      expect.objectContaining({ sectorId: "11111111-1111-4111-8111-111111111111", villageText: "Kabuga" }),
    );
    expect(response.body.phoneNumber).toBe("0788123456");
  });

  it("registers a farmer with a chosen preferredLanguage (Phase 9 onboarding language step)", async () => {
    const response = await request(app.getHttpServer())
      .post("/farmers/register")
      .send({ phoneNumber: "0788123456", preferredLanguage: "rw" })
      .expect(201);

    expect(farmersService.registerOrFind).toHaveBeenCalledWith(expect.objectContaining({ preferredLanguage: "rw" }));
    expect(response.body.preferredLanguage).toBe("rw");
  });

  it("rejects an invalid preferredLanguage value", async () => {
    await request(app.getHttpServer())
      .post("/farmers/register")
      .send({ phoneNumber: "0788123456", preferredLanguage: "de" })
      .expect(400);

    expect(farmersService.registerOrFind).not.toHaveBeenCalled();
  });

  describe("PATCH /farmers/:id/language", () => {
    it("updates the farmer's preferredLanguage", async () => {
      const response = await request(app.getHttpServer())
        .patch("/farmers/22222222-2222-4222-8222-222222222222/language")
        .send({ preferredLanguage: "fr" })
        .expect(200);

      expect(farmersService.updatePreferredLanguage).toHaveBeenCalledWith(
        "22222222-2222-4222-8222-222222222222",
        "fr",
      );
      expect(response.body).toEqual({ farmerId: "22222222-2222-4222-8222-222222222222", preferredLanguage: "fr" });
    });

    it("rejects an invalid preferredLanguage value", async () => {
      await request(app.getHttpServer())
        .patch("/farmers/22222222-2222-4222-8222-222222222222/language")
        .send({ preferredLanguage: "de" })
        .expect(400);

      expect(farmersService.updatePreferredLanguage).not.toHaveBeenCalled();
    });

    // Regression (Phase 10a #11): a nonexistent farmerId used to be
    // indistinguishable from this angle anyway (the old code threw from
    // inside the service, but this response shape must stay identical to the
    // success case too) — updatePreferredLanguage silently no-ops for a
    // missing farmer, so this endpoint returns the exact same 200 shape
    // regardless of whether the id was ever real.
    it("returns the same 200 shape even when the farmerId doesn't exist (silent no-op, not a distinguishable error)", async () => {
      const response = await request(app.getHttpServer())
        .patch("/farmers/00000000-0000-4000-8000-000000000000/language")
        .send({ preferredLanguage: "fr" })
        .expect(200);

      expect(response.body).toEqual({ farmerId: "00000000-0000-4000-8000-000000000000", preferredLanguage: "fr" });
    });
  });

  describe("GET /farmers/:id/language", () => {
    it("returns the farmer's preferredLanguage", async () => {
      const response = await request(app.getHttpServer())
        .get("/farmers/22222222-2222-4222-8222-222222222222/language")
        .expect(200);

      expect(farmersService.getPreferredLanguage).toHaveBeenCalledWith("22222222-2222-4222-8222-222222222222");
      expect(response.body).toEqual({ farmerId: "22222222-2222-4222-8222-222222222222", preferredLanguage: "rw" });
    });

    // Regression (Phase 10a #11): this used to 404 for a nonexistent farmer
    // and 200 for a real one — a distinguishable oracle an attacker could use
    // to enumerate which farmerIds are actually registered. Both cases must
    // now produce the exact same response shape.
    it("returns 200 with preferredLanguage: null for a nonexistent farmer — indistinguishable from a real farmer with no preference set, not a 404", async () => {
      farmersService.getPreferredLanguage.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get("/farmers/22222222-2222-4222-8222-222222222222/language")
        .expect(200);

      expect(response.body).toEqual({ farmerId: "22222222-2222-4222-8222-222222222222", preferredLanguage: null });
    });
  });

  it("rejects a malformed sectorId", async () => {
    await request(app.getHttpServer())
      .post("/farmers/register")
      .send({ phoneNumber: "0788123456", sectorId: "not-a-uuid" })
      .expect(400);

    expect(farmersService.registerOrFind).not.toHaveBeenCalled();
  });

  it("rejects when phoneNumber is missing", async () => {
    await request(app.getHttpServer()).post("/farmers/register").send({}).expect(400);

    expect(farmersService.registerOrFind).not.toHaveBeenCalled();
  });

  it("rejects an unexpected extra field instead of silently passing it through", async () => {
    await request(app.getHttpServer())
      .post("/farmers/register")
      .send({ phoneNumber: "0788123456", role: "admin" })
      .expect(400);

    expect(farmersService.registerOrFind).not.toHaveBeenCalled();
  });

  it("rate-limits registration after the configured threshold (5/minute), with a farmer-friendly 429", async () => {
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer()).post("/farmers/register").send({ phoneNumber: "0788123456" }).expect(201);
    }

    const throttled = await request(app.getHttpServer()).post("/farmers/register").send({ phoneNumber: "0788123456" }).expect(429);

    expect(throttled.body.message).toMatch(/sending requests a bit too quickly/i);
  });
});

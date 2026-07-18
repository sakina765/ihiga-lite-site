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
  let farmersService: { registerOrFind: jest.Mock };

  beforeEach(async () => {
    farmersService = {
      registerOrFind: jest.fn(async (phoneNumber: string, district?: string) => ({
        id: "33333333-3333-4333-8333-333333333333",
        phoneNumber,
        district: district ?? null,
      })),
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

    expect(farmersService.registerOrFind).toHaveBeenCalledWith("0788123456", undefined, undefined, undefined);
    expect(response.body).toEqual({
      farmerId: "33333333-3333-4333-8333-333333333333",
      phoneNumber: "0788123456",
      district: null,
    });
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

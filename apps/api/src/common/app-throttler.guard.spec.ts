import { Controller, Get, INestApplication, Logger } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { ThrottlerModule } from "@nestjs/throttler";
import request from "supertest";
import { AppThrottlerGuard } from "./app-throttler.guard";

@Controller("ping")
class PingController {
  @Get()
  ping() {
    return { ok: true };
  }
}

// A small limit (3/minute) keeps this test fast and deterministic — the exact
// number doesn't matter, only that requests beyond it are throttled.
const TEST_LIMIT = 3;

describe("AppThrottlerGuard (rate limiting)", () => {
  let app: INestApplication;
  let warnSpy: jest.SpyInstance;

  beforeEach(async () => {
    warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);

    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: TEST_LIMIT }])],
      controllers: [PingController],
      providers: [{ provide: APP_GUARD, useClass: AppThrottlerGuard }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  it("allows requests up to the configured limit, then returns 429 with a farmer-friendly message", async () => {
    for (let i = 0; i < TEST_LIMIT; i++) {
      await request(app.getHttpServer()).get("/ping").expect(200);
    }

    const throttled = await request(app.getHttpServer()).get("/ping").expect(429);

    expect(throttled.body.message).toMatch(/sending requests a bit too quickly/i);
    expect(throttled.body.message).not.toMatch(/ThrottlerException/i);
  });

  it("logs a warning when a limit actually fires, without leaking the full client IP", async () => {
    for (let i = 0; i < TEST_LIMIT; i++) {
      await request(app.getHttpServer()).get("/ping");
    }
    await request(app.getHttpServer()).get("/ping").expect(429);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const loggedText = warnSpy.mock.calls[0][0] as string;
    expect(loggedText).toMatch(/rate limit exceeded/);
    expect(loggedText).toMatch(/path=\/ping/);
    // supertest requests come from the loopback address — its exact string
    // form varies (127.0.0.1 vs ::ffff:127.0.0.1) but maskIpAddress() always
    // zeroes the trailing segment, so the untouched address should never
    // appear verbatim in the log line.
    expect(loggedText).not.toContain("127.0.0.1 ");
  });
});

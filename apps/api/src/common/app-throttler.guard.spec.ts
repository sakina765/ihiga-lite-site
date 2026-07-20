import { Controller, Get, INestApplication, Logger } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
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

// Regression (Phase 10a #4): main.ts sets `app.set("trust proxy", 1)` so
// req.ip resolves to the real client address Render's single reverse-proxy
// hop appended to X-Forwarded-For, instead of Render's own proxy address
// (which every request would otherwise share, collapsing the entire farmer
// population into one rate-limit bucket). This app is built the same way
// main.ts builds the real one — same trust-proxy call, same guard — to prove
// the tracker actually reads X-Forwarded-For once that's configured, and
// that spoofing an X-Forwarded-For prefix doesn't let a client claim someone
// else's bucket (Express/proxy-addr uses the LAST hop, the one the trusted
// proxy itself appended, not anything earlier in the header a client could
// have set themselves).
describe("AppThrottlerGuard behind a trusted single reverse proxy (trust proxy = 1)", () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);

    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: TEST_LIMIT }])],
      controllers: [PingController],
      providers: [{ provide: APP_GUARD, useClass: AppThrottlerGuard }],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.set("trust proxy", 1);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  it("gives distinct clients distinct rate-limit buckets, keyed off the X-Forwarded-For address the trusted proxy appended", async () => {
    const clientA = "203.0.113.10";
    const clientB = "203.0.113.20";

    // Client A uses up their whole bucket...
    for (let i = 0; i < TEST_LIMIT; i++) {
      await request(app.getHttpServer()).get("/ping").set("X-Forwarded-For", clientA).expect(200);
    }
    await request(app.getHttpServer()).get("/ping").set("X-Forwarded-For", clientA).expect(429);

    // ...but Client B, a completely different address, is untouched — proof
    // the two requests aren't sharing one bucket the way they would if
    // req.ip fell back to a single shared proxy/loopback address.
    await request(app.getHttpServer()).get("/ping").set("X-Forwarded-For", clientB).expect(200);
  });

  it("trusts only the last (proxy-appended) hop, not an earlier client-supplied prefix someone could forge", async () => {
    // A malicious caller prepends a fake address before the real one a
    // single trusted proxy would have appended. With trust proxy = 1,
    // Express must resolve the client to the LAST entry (203.0.113.99, what
    // the one trusted hop actually observed), not the attacker-forged first
    // entry — otherwise two different forged prefixes in front of the same
    // real client would incorrectly get separate buckets.
    const forgedPrefixA = "1.2.3.4, 203.0.113.99";
    const forgedPrefixB = "5.6.7.8, 203.0.113.99";

    for (let i = 0; i < TEST_LIMIT; i++) {
      await request(app.getHttpServer()).get("/ping").set("X-Forwarded-For", forgedPrefixA).expect(200);
    }
    // Same real trusted hop (203.0.113.99), different forged prefix — still
    // throttled, proving the forged prefix was never the address that got used.
    await request(app.getHttpServer()).get("/ping").set("X-Forwarded-For", forgedPrefixB).expect(429);
  });
});

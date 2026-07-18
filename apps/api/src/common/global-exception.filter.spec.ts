import { BadGatewayException, BadRequestException, INestApplication, Controller, Get } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { GlobalExceptionFilter } from "./global-exception.filter";

@Controller("boom")
class BoomController {
  @Get("client-error")
  clientError(): never {
    throw new BadRequestException("phoneNumber is required");
  }

  @Get("upstream-error")
  upstreamError(): never {
    // Mirrors chat.controller.ts's transcribe() catch — a 5xx HttpException
    // carrying an upstream error's raw message.
    throw new BadGatewayException("Could not transcribe audio: 401 Incorrect API key provided: gsk_super_secret_key_do_not_leak");
  }

  @Get("raw-error")
  rawError(): never {
    throw new Error("relation \"farmers\" does not exist — column mismatch in query XYZ");
  }
}

describe("GlobalExceptionFilter", () => {
  let app: INestApplication;
  const originalNodeEnv = process.env.NODE_ENV;

  async function buildApp(): Promise<INestApplication> {
    const moduleRef = await Test.createTestingModule({
      controllers: [BoomController],
      providers: [{ provide: APP_FILTER, useClass: GlobalExceptionFilter }],
    }).compile();
    const nestApp = moduleRef.createNestApplication();
    await nestApp.init();
    return nestApp;
  }

  afterEach(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    if (app) {
      await app.close();
    }
  });

  it("passes 4xx client errors through unchanged", async () => {
    app = await buildApp();

    const response = await request(app.getHttpServer()).get("/boom/client-error").expect(400);

    expect(response.body.message).toBe("phoneNumber is required");
    expect(response.body.errorId).toBeUndefined();
  });

  it("in production, replaces a 5xx HttpException's message with a generic one and never leaks the raw upstream detail", async () => {
    process.env.NODE_ENV = "production";
    app = await buildApp();

    const response = await request(app.getHttpServer()).get("/boom/upstream-error").expect(502);

    expect(response.body.message).toBe("Something went wrong on our end. Please try again in a moment.");
    expect(response.body.errorId).toEqual(expect.any(String));
    expect(JSON.stringify(response.body)).not.toContain("gsk_super_secret_key_do_not_leak");
    expect(JSON.stringify(response.body)).not.toContain("Incorrect API key");
  });

  it("in production, converts a raw (non-HttpException) error into a generic 500 with no stack trace or internal detail", async () => {
    process.env.NODE_ENV = "production";
    app = await buildApp();

    const response = await request(app.getHttpServer()).get("/boom/raw-error").expect(500);

    expect(response.body.message).toBe("Something went wrong on our end. Please try again in a moment.");
    expect(response.body.errorId).toEqual(expect.any(String));
    expect(JSON.stringify(response.body)).not.toContain("relation");
    expect(JSON.stringify(response.body)).not.toContain("at ");
  });

  it("outside production, still surfaces the real message for debugging but never a stack trace in the body", async () => {
    process.env.NODE_ENV = "test";
    app = await buildApp();

    const response = await request(app.getHttpServer()).get("/boom/raw-error").expect(500);

    expect(response.body.message).toContain("relation \"farmers\" does not exist");
    expect(response.body.errorId).toEqual(expect.any(String));
    expect(JSON.stringify(response.body)).not.toContain("at Object");
  });

  it("gives every 5xx response a distinct errorId", async () => {
    process.env.NODE_ENV = "production";
    app = await buildApp();

    const first = await request(app.getHttpServer()).get("/boom/raw-error").expect(500);
    const second = await request(app.getHttpServer()).get("/boom/raw-error").expect(500);

    expect(first.body.errorId).not.toBe(second.body.errorId);
  });
});

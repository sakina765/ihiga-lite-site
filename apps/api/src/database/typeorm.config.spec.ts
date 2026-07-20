import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { buildTypeOrmOptions } from "./typeorm.config";

function makeConfigService(values: Record<string, string | undefined>): ConfigService {
  return { get: jest.fn((key: string) => values[key]) } as unknown as ConfigService;
}

describe("buildTypeOrmOptions", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  describe("synchronize safety net (Phase 10a #5)", () => {
    it("honors DATABASE_SYNCHRONIZE=true outside production", () => {
      process.env.NODE_ENV = "development";
      const options = buildTypeOrmOptions(makeConfigService({ DATABASE_SYNCHRONIZE: "true" }));

      expect(options.synchronize).toBe(true);
    });

    it("hard-refuses synchronize when NODE_ENV=production, even if DATABASE_SYNCHRONIZE=true", () => {
      process.env.NODE_ENV = "production";
      const options = buildTypeOrmOptions(makeConfigService({ DATABASE_SYNCHRONIZE: "true" }));

      expect(options.synchronize).toBe(false);
    });

    it("logs a visible warning when a production DATABASE_SYNCHRONIZE=true was blocked, so it's never a silent no-op", () => {
      process.env.NODE_ENV = "production";
      buildTypeOrmOptions(makeConfigService({ DATABASE_SYNCHRONIZE: "true" }));

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/DATABASE_SYNCHRONIZE=true.*production.*refusing/is);
    });

    it("doesn't warn when DATABASE_SYNCHRONIZE is unset/false in production (the expected, healthy case)", () => {
      process.env.NODE_ENV = "production";
      buildTypeOrmOptions(makeConfigService({ DATABASE_SYNCHRONIZE: "false" }));

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("stays false when DATABASE_SYNCHRONIZE is unset, regardless of environment", () => {
      process.env.NODE_ENV = "development";
      const options = buildTypeOrmOptions(makeConfigService({}));

      expect(options.synchronize).toBe(false);
    });
  });

  describe("SSL certificate validation (Phase 10a #6)", () => {
    it("validates the server certificate (rejectUnauthorized: true) when DATABASE_SSL=true", () => {
      const options = buildTypeOrmOptions(makeConfigService({ DATABASE_SSL: "true" }));

      expect((options as { ssl?: unknown }).ssl).toEqual({ rejectUnauthorized: true });
    });

    it("disables SSL entirely when DATABASE_SSL isn't 'true' (local Postgres)", () => {
      const options = buildTypeOrmOptions(makeConfigService({ DATABASE_SSL: "false" }));

      expect((options as { ssl?: unknown }).ssl).toBe(false);
    });
  });

  describe("connection pool size (Phase 10a #12)", () => {
    it("sets an explicit, bounded pool size rather than relying on driver defaults", () => {
      const options = buildTypeOrmOptions(makeConfigService({}));

      expect((options as { extra?: { max?: number } }).extra?.max).toBeGreaterThan(0);
      expect((options as { extra?: { max?: number } }).extra?.max).toBeLessThanOrEqual(20);
    });
  });
});

jest.mock("fs");

describe("loadDatabaseCaCert", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Logger is re-required from the same (reset) module registry as
  // database-ssl.util.ts in each test, not from a top-level import — a
  // top-level import predates jest.resetModules() and would spy on a
  // different copy of @nestjs/common than the one database-ssl.util.ts
  // actually loads once its module registry is reset.
  function spyOnWarn(): jest.SpyInstance {
    const { Logger } = require("@nestjs/common");
    return jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  }

  it("returns the file's contents when the Supabase CA cert is present", () => {
    const warnSpy = spyOnWarn();
    const fs = require("fs");
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue("-----BEGIN CERTIFICATE-----\nFAKE\n-----END CERTIFICATE-----\n");

    const { loadDatabaseCaCert } = require("./database-ssl.util");

    expect(loadDatabaseCaCert()).toBe("-----BEGIN CERTIFICATE-----\nFAKE\n-----END CERTIFICATE-----\n");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("returns undefined and logs a warning (once) when the cert file isn't present yet", () => {
    const warnSpy = spyOnWarn();
    const fs = require("fs");
    fs.existsSync.mockReturnValue(false);

    const { loadDatabaseCaCert } = require("./database-ssl.util");

    expect(loadDatabaseCaCert()).toBeUndefined();
    expect(loadDatabaseCaCert()).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/self-signed certificate in certificate chain/);
  });

  it("caches the cert after the first successful read instead of re-reading the file every call", () => {
    const fs = require("fs");
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue("cert-contents");

    const { loadDatabaseCaCert } = require("./database-ssl.util");

    loadDatabaseCaCert();
    loadDatabaseCaCert();

    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
  });
});

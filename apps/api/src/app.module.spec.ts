import "reflect-metadata";
import { MODULE_METADATA } from "@nestjs/common/constants";

// Re-verifies (Phase 7) what Phase 6 claimed: DebugModule — and therefore
// every /debug/* route — must not exist in AppModule's module graph at all
// when NODE_ENV=production, not just be runtime-guarded. app.module.ts reads
// process.env.NODE_ENV once at module-load time, so each case here sets the
// env var, resets Jest's module registry, and re-imports the module fresh to
// actually exercise that branch rather than trusting the prior claim.
describe("AppModule — DebugModule production gating", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.resetModules();
  });

  function getImportedModuleNames(appModule: unknown): string[] {
    const imports = (Reflect.getMetadata(MODULE_METADATA.IMPORTS, appModule as new (...args: unknown[]) => unknown) ?? []) as Array<{
      name?: string;
    }>;
    return imports.map((m) => m?.name).filter((name): name is string => Boolean(name));
  }

  it("excludes DebugModule when NODE_ENV=production", async () => {
    process.env.NODE_ENV = "production";
    jest.resetModules();

    const { AppModule } = await import("./app.module");

    expect(getImportedModuleNames(AppModule)).not.toContain("DebugModule");
  });

  it("includes DebugModule when NODE_ENV is not production", async () => {
    process.env.NODE_ENV = "development";
    jest.resetModules();

    const { AppModule } = await import("./app.module");

    expect(getImportedModuleNames(AppModule)).toContain("DebugModule");
  });
});

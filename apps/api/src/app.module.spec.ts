import "reflect-metadata";
import { MODULE_METADATA } from "@nestjs/common/constants";

// Re-verifies (Phase 7, hardened in Phase 10a #7) that DebugModule — and
// therefore every /debug/* route, including one that fires a real Groq API
// call and one that triggers the real SMS job on demand — must not exist in
// AppModule's module graph at all unless NODE_ENV is EXACTLY "development",
// not just be runtime-guarded. This is an allowlist (fail-closed): only the
// one explicitly-confirmed-safe value includes it, everything else excludes
// it — the opposite failure mode from the old denylist, which excluded it
// only for an exact "production" match and left it mounted for anything
// else, including an unset NODE_ENV. app.module.ts reads process.env.NODE_ENV
// once at module-load time, so each case here sets the env var, resets
// Jest's module registry, and re-imports the module fresh to actually
// exercise that branch rather than trusting the prior claim.
describe("AppModule — DebugModule gating (allowlist, Phase 10a #7)", () => {
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

  it("includes DebugModule when NODE_ENV is exactly 'development'", async () => {
    process.env.NODE_ENV = "development";
    jest.resetModules();

    const { AppModule } = await import("./app.module");

    expect(getImportedModuleNames(AppModule)).toContain("DebugModule");
  });

  it("excludes DebugModule when NODE_ENV=production", async () => {
    process.env.NODE_ENV = "production";
    jest.resetModules();

    const { AppModule } = await import("./app.module");

    expect(getImportedModuleNames(AppModule)).not.toContain("DebugModule");
  });

  it.each([
    ["unset", undefined],
    ["staging", "staging"],
    ["wrong case ('Production')", "Production"],
    ["empty string", ""],
    ["test", "test"],
    ["qa", "qa"],
    ["typo ('developmnet')", "developmnet"],
  ])("excludes DebugModule when NODE_ENV is %s — the old denylist would have left this mounted", async (_label, value) => {
    if (value === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = value;
    }
    jest.resetModules();

    const { AppModule } = await import("./app.module");

    expect(getImportedModuleNames(AppModule)).not.toContain("DebugModule");
  });
});

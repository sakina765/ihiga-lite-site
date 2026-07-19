import { LanguageService } from "./language.service";

describe("LanguageService", () => {
  const service = new LanguageService();

  it("defaults to English when no markers match", () => {
    expect(service.detect("When should I plant maize this season?")).toBe("en");
  });

  it("detects Kinyarwanda from common markers", () => {
    expect(service.detect("Murakoze, ndashaka kumenya ryari nateye ibigori")).toBe("rw");
  });

  it("detects French from common markers and accented characters", () => {
    expect(service.detect("Bonjour, quand est-ce que je dois récolter le maïs?")).toBe("fr");
  });

  it("detects a short French confirmation like 'Oui'", () => {
    expect(service.detect("Oui")).toBe("fr");
  });

  it("detects a short French negation like 'Non'", () => {
    expect(service.detect("Non merci")).toBe("fr");
  });

  it("detects a bare crop name in French, e.g. 'Riz'", () => {
    expect(service.detect("Riz")).toBe("fr");
  });

  it("does not mistake 'best' for the French marker 'est'", () => {
    expect(service.detect("What is the best season of coffee?")).toBe("en");
  });

  it("does not mistake 'harvest' for the French marker 'est'", () => {
    expect(service.detect("Give the best months to harvest the coffee")).toBe("en");
  });

  it("does not mistake 'get'/'yet' for the French marker 'et'", () => {
    expect(service.detect("Not yet, I'll get to it when I plant")).toBe("en");
  });
});

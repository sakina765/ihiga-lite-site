import { act, render, screen, fireEvent } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "./LanguageProvider";

// A deliberately incomplete "rw" dictionary so the missing-key fallback path
// is actually exercised — the real rw.json has full coverage, so testing the
// fallback against it would never trigger.
jest.mock("./dictionaries/rw.json", () => ({
  "languageSwitcher.en": "EN",
  "languageSwitcher.rw": "RW",
  "languageSwitcher.fr": "FR",
  "languageSwitcher.ariaLabel": "Hindura ururimi",
  // "chat.header.online" deliberately omitted to test English fallback.
}));

function Probe() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="online-label">{t("chat.header.online")}</span>
      <span data-testid="missing-everywhere">{t("this.key.does.not.exist.anywhere")}</span>
      <button type="button" onClick={() => setLanguage("rw")}>
        switch to rw
      </button>
    </div>
  );
}

describe("LanguageProvider", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    localStorage.clear();
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("defaults to English and translates a known key", () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    expect(screen.getByTestId("language")).toHaveTextContent("en");
    expect(screen.getByTestId("online-label")).toHaveTextContent("Online");
  });

  it("falls back to English when the current language is missing a key, and warns", async () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    await act(async () => {
      fireEvent.click(screen.getByText("switch to rw"));
    });

    expect(screen.getByTestId("language")).toHaveTextContent("rw");
    // "chat.header.online" is missing from the mocked rw dictionary above —
    // must show the English string, never blank or the raw key.
    expect(screen.getByTestId("online-label")).toHaveTextContent("Online");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('missing translation key "chat.header.online"'));
  });

  it("falls back to the key itself (and warns) when a key is missing from every dictionary", () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    expect(screen.getByTestId("missing-everywhere")).toHaveTextContent("this.key.does.not.exist.anywhere");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('missing translation key "this.key.does.not.exist.anywhere"'));
  });

  it("persists the chosen language to localStorage", async () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    await act(async () => {
      fireEvent.click(screen.getByText("switch to rw"));
    });

    expect(localStorage.getItem("ihiga_language")).toBe("rw");
  });

  it("throws when useLanguage is called outside a LanguageProvider", () => {
    // Swallow the expected React error-boundary console.error noise for this one assertion.
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow("useLanguage must be used within a LanguageProvider");
    errorSpy.mockRestore();
  });
});

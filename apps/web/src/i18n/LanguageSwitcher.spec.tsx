import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "./LanguageProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

/** Stands in for any t()-driven piece of UI chrome elsewhere on the page — proves a switcher click re-renders text app-wide, not just itself. */
function SomeOtherChrome() {
  const { t } = useLanguage();
  return <p data-testid="chrome-text">{t("chat.header.online")}</p>;
}

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders all three language options with English active by default", () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>,
    );

    expect(screen.getByText("EN")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("RW")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("FR")).toHaveAttribute("aria-pressed", "false");
  });

  it("switching language re-renders other t()-driven UI immediately, without a reload", () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
        <SomeOtherChrome />
      </LanguageProvider>,
    );

    expect(screen.getByTestId("chrome-text")).toHaveTextContent("Online");

    fireEvent.click(screen.getByText("FR"));

    expect(screen.getByTestId("chrome-text")).toHaveTextContent("En ligne");
    expect(screen.getByText("FR")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("EN")).toHaveAttribute("aria-pressed", "false");
  });

  it("switching to Kinyarwanda updates both the switcher state and dependent UI", () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
        <SomeOtherChrome />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByText("RW"));

    expect(screen.getByTestId("chrome-text")).toHaveTextContent("Arahari");
    expect(screen.getByText("RW")).toHaveAttribute("aria-pressed", "true");
  });
});

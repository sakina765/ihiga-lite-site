"use client";

import type { ChatLanguage } from "@ihiga-lite/shared";
import { useLanguage } from "./LanguageProvider";

const LANGUAGES: ChatLanguage[] = ["en", "rw", "fr"];

/**
 * The persistent switcher touchpoint (Phase 9 §2) — used in both the
 * homepage header/footer and the /chat header. Switching re-renders every
 * t()-driven string immediately (LanguageProvider's context update), no
 * reload, and also becomes the Farmer.preferredLanguage override for a
 * registered farmer (see LanguageProvider.setLanguage).
 */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("languageSwitcher.ariaLabel")}
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border border-leaf/40 p-0.5 text-[11px] font-medium tracking-wide ${className}`}
    >
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          aria-pressed={language === lang}
          className={
            language === lang
              ? "rounded-full bg-sage px-2 py-0.5 text-parchment"
              : "rounded-full px-2 py-0.5 text-leaf transition-colors hover:bg-sage/20"
          }
        >
          {t(`languageSwitcher.${lang}`)}
        </button>
      ))}
    </div>
  );
}

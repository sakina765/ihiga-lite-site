"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ChatLanguage } from "@ihiga-lite/shared";
import en from "./dictionaries/en.json";
import rw from "./dictionaries/rw.json";
import fr from "./dictionaries/fr.json";

type Dictionary = Record<string, string>;

const DICTIONARIES: Record<ChatLanguage, Dictionary> = { en, rw, fr };

// Must match ChatGate.tsx's STORAGE_KEY — read directly (not via React context)
// since LanguageProvider wraps the whole app, including the anonymous
// homepage, where no farmerId context exists yet.
const FARMER_STORAGE_KEY = "ihiga_farmer_id";
const LANGUAGE_STORAGE_KEY = "ihiga_language";

function isChatLanguage(value: string | null): value is ChatLanguage {
  return value === "en" || value === "rw" || value === "fr";
}

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

interface LanguageContextValue {
  language: ChatLanguage;
  setLanguage: (language: ChatLanguage) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * App-wide UI language — Context + flat JSON dictionaries, deliberately not a
 * full i18n library (next-intl/i18next), to keep the bundle light for the
 * low-end-Android performance target. Precedence on load: a returning
 * REGISTERED farmer's server-stored preference wins over localStorage;
 * anonymous/pre-registration visitors get whatever localStorage has, or "en".
 *
 * Known tradeoff: initial render is always "en" (matching the static
 * `<html lang="en">` in layout.tsx to avoid a hydration mismatch) — a
 * returning farmer with rw/fr already set may see a brief flash of English
 * before the stored preference applies post-mount. Acceptable for this
 * lightweight approach; a cookie-based SSR read would remove it at the cost
 * of the simplicity this phase asked for.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<ChatLanguage>("en");

  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isChatLanguage(stored)) {
      setLanguageState(stored);
    }

    const farmerId = localStorage.getItem(FARMER_STORAGE_KEY);
    if (!farmerId) {
      return;
    }
    fetch(`${getApiUrl()}/farmers/${encodeURIComponent(farmerId)}/language`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { preferredLanguage?: ChatLanguage | null } | null) => {
        if (data?.preferredLanguage) {
          setLanguageState(data.preferredLanguage);
          localStorage.setItem(LANGUAGE_STORAGE_KEY, data.preferredLanguage);
        }
      })
      .catch(() => {
        // Network hiccup on load — keep whatever localStorage/default already gave us.
      });
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: ChatLanguage) => {
    setLanguageState(next);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next);

    // Sync to the Farmer record too, once one exists — best-effort: the UI
    // has already switched regardless of whether this call succeeds.
    const farmerId = localStorage.getItem(FARMER_STORAGE_KEY);
    if (farmerId) {
      fetch(`${getApiUrl()}/farmers/${encodeURIComponent(farmerId)}/language`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLanguage: next }),
      }).catch(() => {
        // Best-effort — Groq's replies may lag the UI language until the next
        // successful sync (another switch, or a reload re-attempting it).
      });
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const value = DICTIONARIES[language][key] ?? DICTIONARIES.en[key];
      if (value === undefined) {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] missing translation key "${key}" — no entry in "${language}" or the English fallback`);
        return key;
      }
      if (DICTIONARIES[language][key] === undefined) {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] missing translation key "${key}" for language "${language}" — falling back to English`);
      }
      return interpolate(value, vars);
    },
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

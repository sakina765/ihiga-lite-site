import type { ChatLanguage } from "@ihiga-lite/shared";

const LANGUAGE_LABELS: Record<ChatLanguage, string> = {
  en: "EN",
  rw: "RW",
  fr: "FR",
};

export function ChatHeader({ language }: { language: ChatLanguage | null }) {
  return (
    <header className="flex items-center gap-3 bg-soil-deep px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage text-lg" aria-hidden="true">
        🌱
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-parchment">Ihiga</p>
        <p className="flex items-center gap-1.5 text-xs text-leaf">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage" aria-hidden="true" />
          Online
        </p>
      </div>
      {language && (
        <span
          className="shrink-0 rounded-full border border-leaf/40 px-2 py-0.5 text-[11px] font-medium tracking-wide text-leaf"
          title="Language Ihiga thinks you're speaking"
        >
          {LANGUAGE_LABELS[language]}
        </span>
      )}
    </header>
  );
}

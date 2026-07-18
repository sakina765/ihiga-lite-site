import type { ChatLanguage } from "@ihiga-lite/shared";
import robotGif from "../../app/robot.gif";

const LANGUAGE_LABELS: Record<ChatLanguage, string> = {
  en: "EN",
  rw: "RW",
  fr: "FR",
};

export function ChatHeader({ language }: { language: ChatLanguage | null }) {
  return (
    <header className="bg-soil-deep px-4 py-3">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-sage" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- plain <img> guarantees
              the GIF's animation is preserved; next/image's optimizer re-encodes images
              and isn't guaranteed to keep animated frames intact. */}
          <img src={robotGif.src} alt="" className="h-full w-full object-cover" />
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
      </div>
    </header>
  );
}

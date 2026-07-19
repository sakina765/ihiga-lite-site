import Link from "next/link";
import robotGif from "../../app/robot.gif";
import { useLanguage } from "../../i18n/LanguageProvider";
import { LanguageSwitcher } from "../../i18n/LanguageSwitcher";

export function ChatHeader() {
  const { t } = useLanguage();

  return (
    <header className="relative bg-soil-deep px-4 py-3">
      {/* Pinned to the header's own left edge, independent of the mx-auto
          centered content below — inside that centered block, the arrow
          would drift away from the true left edge on any viewport wider
          than max-w-3xl (768px), landing near the middle-left instead of
          flush against the actual side of the screen. */}
      <Link
        href="/"
        aria-label={t("chat.header.backAria")}
        className="absolute left-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-xl leading-none text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
      >
        <span aria-hidden="true">←</span>
      </Link>
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-sage" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- plain <img> guarantees
              the GIF's animation is preserved; next/image's optimizer re-encodes images
              and isn't guaranteed to keep animated frames intact. */}
          <img src={robotGif.src} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-parchment">{t("chat.header.name")}</p>
          <p className="flex items-center gap-1.5 text-xs text-leaf">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage" aria-hidden="true" />
            {t("chat.header.online")}
          </p>
        </div>
        {/* Phase 9: this used to be a passive pill showing what language Groq
            detected — replaced with the actual explicit switcher, since a
            farmer's chosen preference is now the authoritative language
            (see ChatOrchestratorService.resolveLanguage), not a per-message guess. */}
        <LanguageSwitcher />
      </div>
    </header>
  );
}

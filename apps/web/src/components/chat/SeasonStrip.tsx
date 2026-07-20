import type { SeasonInfo } from "@ihiga-lite/shared";
import { useLanguage } from "../../i18n/LanguageProvider";

export const SEASON_DESCRIPTOR_KEY: Record<SeasonInfo["code"], string> = {
  A: "chat.season.descriptorA",
  B: "chat.season.descriptorB",
  C: "chat.season.descriptorC",
};

export function formatMonthRange(startIso: string, endIso: string): string {
  const fmt = new Intl.DateTimeFormat("en", { month: "short" });
  return `${fmt.format(new Date(startIso))}–${fmt.format(new Date(endIso))}`;
}

export function SeasonStrip({ season }: { season: SeasonInfo | null }) {
  const { t } = useLanguage();

  if (!season) {
    return (
      <div className="border-b border-parchment-2 bg-parchment-3 px-4 py-2 text-xs text-ink-faint">
        <div className="mx-auto w-full max-w-3xl">{t("chat.season.loading")}</div>
      </div>
    );
  }

  return (
    <div className="border-b border-parchment-2 bg-parchment-3 px-4 py-2 text-xs text-ink-soft">
      <div className="mx-auto w-full max-w-3xl">
        {t("chat.season.label", {
          code: season.code,
          localName: season.localName,
          range: formatMonthRange(season.startDate, season.endDate),
          descriptor: t(SEASON_DESCRIPTOR_KEY[season.code]),
        })}
      </div>
    </div>
  );
}

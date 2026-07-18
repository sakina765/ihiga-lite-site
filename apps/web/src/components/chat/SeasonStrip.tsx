import type { SeasonInfo } from "@ihiga-lite/shared";

const SEASON_DESCRIPTOR: Record<SeasonInfo["code"], string> = {
  A: "planting window open",
  B: "planting window open",
  C: "dry season — irrigation only",
};

function formatMonthRange(startIso: string, endIso: string): string {
  const fmt = new Intl.DateTimeFormat("en", { month: "short" });
  return `${fmt.format(new Date(startIso))}–${fmt.format(new Date(endIso))}`;
}

export function SeasonStrip({ season }: { season: SeasonInfo | null }) {
  if (!season) {
    return (
      <div className="border-b border-parchment-2 bg-parchment-3 px-4 py-2 text-xs text-ink-faint">
        <div className="mx-auto w-full max-w-3xl">🗓️ Loading season…</div>
      </div>
    );
  }

  return (
    <div className="border-b border-parchment-2 bg-parchment-3 px-4 py-2 text-xs text-ink-soft">
      <div className="mx-auto w-full max-w-3xl">
        🗓️ Season {season.code} ({season.localName}) · {formatMonthRange(season.startDate, season.endDate)} ·{" "}
        {SEASON_DESCRIPTOR[season.code]}
      </div>
    </div>
  );
}

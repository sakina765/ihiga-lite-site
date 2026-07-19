"use client";

import { useState } from "react";
import { useSidebarData } from "./useSidebarData";
import { CollapsibleSection } from "./CollapsibleSection";
import { TodaySummaryCard } from "./TodaySummaryCard";
import { TodayWeatherCard } from "./TodayWeatherCard";
import { ProvinceWeatherAccordion } from "./ProvinceWeatherAccordion";
import { CropSuggestionsCard } from "./CropSuggestionsCard";
import { YourCropCard } from "./YourCropCard";
import { AlertsStrip } from "./AlertsStrip";
import { ChatBackgroundPattern } from "../../ChatBackgroundPattern";
import { useLanguage } from "../../../i18n/LanguageProvider";

/**
 * Auto-populated "farm info" sidebar for /chat — takes only farmerId, fetches
 * its own data via useSidebarData, and never reads from or calls back into
 * ChatWidget. That's what keeps this purely additive: ChatWidget's message/
 * season/language state and its submit* callbacks are completely untouched.
 */
export function ChatSidebar({ farmerId, cropRefreshSignal = 0 }: { farmerId: string; cropRefreshSignal?: number }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();
  const { todayWeather, provinceWeather, cropSuggestions, currentCrop, refreshCurrentCrop } = useSidebarData(
    farmerId,
    cropRefreshSignal,
  );

  const farmerDistrict = todayWeather.data?.district?.district ?? null;
  const weather = todayWeather.data ? (todayWeather.data.farmExact ?? todayWeather.data.district ?? null) : null;
  // Same soilWorkable condition AlertsStrip already reads — only the farmer's
  // own current weather status carries a risk indicator, not regional/crop sections.
  const weatherRisk = weather ? !weather.soilWorkable : false;

  const sections = (
    <>
      <TodaySummaryCard
        weatherData={weather}
        weatherLoading={todayWeather.loading}
        weatherError={todayWeather.error}
        cropData={currentCrop.data}
        cropLoading={currentCrop.loading}
      />
      <CollapsibleSection title={t("sidebar.section.todayWeather")} storageKey="ihiga_sidebar_weather_open" risk={weatherRisk}>
        <TodayWeatherCard data={todayWeather.data} loading={todayWeather.loading} error={todayWeather.error} />
      </CollapsibleSection>
      <CollapsibleSection title={t("sidebar.section.regionalWeather")} defaultOpen={false} storageKey="ihiga_sidebar_regional_open" headerIcon="🌧️">
        <ProvinceWeatherAccordion
          data={provinceWeather.data}
          loading={provinceWeather.loading}
          error={provinceWeather.error}
          farmerDistrict={farmerDistrict}
          farmExact={todayWeather.data?.farmExact}
        />
      </CollapsibleSection>
      <CollapsibleSection title={t("sidebar.section.cropSuggestions")} storageKey="ihiga_sidebar_suggestions_open">
        <CropSuggestionsCard data={cropSuggestions.data} loading={cropSuggestions.loading} error={cropSuggestions.error} />
      </CollapsibleSection>
      <CollapsibleSection title={t("sidebar.section.yourCrop")} defaultOpen={false} storageKey="ihiga_sidebar_crop_open">
        <YourCropCard
          data={currentCrop.data}
          loading={currentCrop.loading}
          error={currentCrop.error}
          farmerId={farmerId}
          onUpdated={refreshCurrentCrop}
        />
      </CollapsibleSection>
    </>
  );

  return (
    <>
      {/* Mobile/narrow: collapses into a toggle bar under the header — data
          still loads on mount regardless of whether this is open.
          ChatBackgroundPattern reused here (same absolute inset-0 SVG
          MessageList uses) so this panel shares the chat's actual background
          texture, not just its base color. */}
      <div className="relative overflow-hidden border-b border-parchment-2 bg-parchment md:hidden">
        <ChatBackgroundPattern />
        <div className="relative">
          <AlertsStrip data={todayWeather.data} />
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-ink"
          >
            {t("sidebar.farmInfo")}
            <span aria-hidden="true">{mobileOpen ? "▲" : "▼"}</span>
          </button>
          {mobileOpen && (
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="flex flex-col gap-2 p-3">{sections}</div>
            </div>
          )}
        </div>
      </div>

      {/* Tablet+: persistent left column. md:min-h-0 is required on this flex
          item (same reason as ChatWidget's message-body column) — without
          it, this column grows to fit ALL its content instead of clipping
          to the row's height, so expanding several sections pushed the
          sidebar's own bottom past where the input bar sits, rather than
          scrolling internally. relative+overflow-hidden / absolute inset-0
          mirrors MessageList's own layering so ChatBackgroundPattern stays
          a fixed background layer instead of scrolling away with content. */}
      <div className="hidden md:flex md:w-80 md:min-h-0 md:shrink-0 md:flex-col md:border-r md:border-parchment-2">
        <div className="relative min-h-0 flex-1 overflow-hidden bg-parchment">
          <ChatBackgroundPattern />
          <div className="absolute inset-0 overflow-y-auto">
            <AlertsStrip data={todayWeather.data} />
            <div className="flex flex-col gap-2 p-3">{sections}</div>
          </div>
        </div>
      </div>
    </>
  );
}

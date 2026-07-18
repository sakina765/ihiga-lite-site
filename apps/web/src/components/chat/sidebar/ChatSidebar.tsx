"use client";

import { useState } from "react";
import { useSidebarData } from "./useSidebarData";
import { CollapsibleSection } from "./CollapsibleSection";
import { TodayWeatherCard } from "./TodayWeatherCard";
import { ProvinceWeatherAccordion } from "./ProvinceWeatherAccordion";
import { CropSuggestionsCard } from "./CropSuggestionsCard";
import { YourCropCard } from "./YourCropCard";
import { AlertsStrip } from "./AlertsStrip";

/**
 * Auto-populated "farm info" sidebar for /chat — takes only farmerId, fetches
 * its own data via useSidebarData, and never reads from or calls back into
 * ChatWidget. That's what keeps this purely additive: ChatWidget's message/
 * season/language state and its submit* callbacks are completely untouched.
 */
export function ChatSidebar({ farmerId }: { farmerId: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { todayWeather, provinceWeather, cropSuggestions, currentCrop } = useSidebarData(farmerId);

  const farmerDistrict = todayWeather.data?.district?.district ?? null;

  const sections = (
    <>
      <CollapsibleSection title="Today's weather">
        <TodayWeatherCard data={todayWeather.data} loading={todayWeather.loading} error={todayWeather.error} />
      </CollapsibleSection>
      <CollapsibleSection title="Regional weather" defaultOpen={false}>
        <ProvinceWeatherAccordion
          data={provinceWeather.data}
          loading={provinceWeather.loading}
          error={provinceWeather.error}
          farmerDistrict={farmerDistrict}
          farmExact={todayWeather.data?.farmExact}
        />
      </CollapsibleSection>
      <CollapsibleSection title="Crop suggestions">
        <CropSuggestionsCard data={cropSuggestions.data} loading={cropSuggestions.loading} error={cropSuggestions.error} />
      </CollapsibleSection>
      <CollapsibleSection title="Your crop" defaultOpen={false}>
        <YourCropCard data={currentCrop.data} loading={currentCrop.loading} error={currentCrop.error} />
      </CollapsibleSection>
    </>
  );

  return (
    <>
      {/* Mobile/narrow: collapses into a toggle bar under the header — data
          still loads on mount regardless of whether this is open. */}
      <div className="border-b border-parchment-2 bg-white md:hidden">
        <AlertsStrip data={todayWeather.data} />
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-ink"
        >
          Farm info
          <span aria-hidden="true">{mobileOpen ? "▲" : "▼"}</span>
        </button>
        {mobileOpen && <div className="max-h-[60vh] overflow-y-auto">{sections}</div>}
      </div>

      {/* Tablet+: persistent left column, own internal scroll. */}
      <div className="hidden md:flex md:w-80 md:shrink-0 md:flex-col md:overflow-y-auto md:border-r md:border-parchment-2 md:bg-white">
        <AlertsStrip data={todayWeather.data} />
        {sections}
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import type { ProvinceWeatherRollup, WeatherInfo } from "@ihiga-lite/shared";

export function ProvinceWeatherAccordion({
  data,
  loading,
  error,
  farmerDistrict,
  farmExact,
}: {
  data: ProvinceWeatherRollup[] | null;
  loading: boolean;
  error: boolean;
  farmerDistrict?: string | null;
  farmExact?: WeatherInfo;
}) {
  const [openProvince, setOpenProvince] = useState<string | null>(null);

  if (loading) {
    return <p className="text-xs text-ink-faint">Loading regional weather…</p>;
  }
  if (error || !data) {
    return <p className="text-xs text-ink-faint">Regional weather unavailable right now.</p>;
  }

  return (
    <div className="space-y-1">
      {data.map((province) => (
        <div key={province.province}>
          <button
            type="button"
            onClick={() => setOpenProvince((current) => (current === province.province ? null : province.province))}
            aria-expanded={openProvince === province.province}
            className="flex w-full items-center justify-between py-1 text-left text-sm text-ink"
          >
            {province.province}
            <span aria-hidden="true" className="text-ink-faint">
              {openProvince === province.province ? "▾" : "▸"}
            </span>
          </button>
          {openProvince === province.province && (
            <ul className="ml-1 space-y-1 border-l border-parchment-2 py-1 pl-3">
              {province.districts.map(({ district, weather }) => {
                const isFarmerDistrict = district === farmerDistrict;
                const shown = isFarmerDistrict && farmExact ? farmExact : weather;
                return (
                  <li key={district} className="text-xs text-ink-soft">
                    <span className="font-medium text-ink">
                      {district}
                      {isFarmerDistrict ? " (you)" : ""}
                    </span>{" "}
                    — {shown.todayRainfallProbability}% rain, {shown.soilWorkable ? "soil workable" : "wait on soil work"}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

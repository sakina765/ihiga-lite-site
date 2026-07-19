"use client";

import { useState } from "react";
import type { ProvinceWeatherRollup, SectorWeather, WeatherInfo } from "@ihiga-lite/shared";
import { getSectorWeather } from "../../../lib/weather-api";
import { StatusPill } from "./StatusPill";
import { useLanguage } from "../../../i18n/LanguageProvider";

interface DistrictSectorState {
  data: SectorWeather[] | null;
  loading: boolean;
  error: boolean;
}

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
  const [openDistrict, setOpenDistrict] = useState<string | null>(null);
  // Keyed by district — loaded lazily, only when that district is expanded,
  // never eagerly for all districts' sectors at once (416 sectors total).
  const [sectorsByDistrict, setSectorsByDistrict] = useState<Record<string, DistrictSectorState>>({});
  const { t } = useLanguage();

  if (loading) {
    return <p className="text-xs text-ink-faint">{t("sidebar.regional.loading")}</p>;
  }
  if (error || !data) {
    return <p className="text-xs text-ink-faint">{t("sidebar.regional.unavailable")}</p>;
  }

  function toggleDistrict(district: string) {
    const willOpen = openDistrict !== district;
    setOpenDistrict(willOpen ? district : null);

    if (willOpen && !sectorsByDistrict[district]) {
      setSectorsByDistrict((prev) => ({ ...prev, [district]: { data: null, loading: true, error: false } }));
      getSectorWeather(district)
        .then((sectors) => setSectorsByDistrict((prev) => ({ ...prev, [district]: { data: sectors, loading: false, error: false } })))
        .catch(() => setSectorsByDistrict((prev) => ({ ...prev, [district]: { data: null, loading: false, error: true } })));
    }
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
                const sectorState = sectorsByDistrict[district];
                const districtOpen = openDistrict === district;

                return (
                  <li key={district}>
                    <button
                      type="button"
                      onClick={() => toggleDistrict(district)}
                      aria-expanded={districtOpen}
                      className="flex w-full items-center justify-between gap-2 py-1 text-left text-xs"
                    >
                      <span className="font-medium text-ink">
                        {district}
                        {isFarmerDistrict ? t("sidebar.regional.youSuffix") : ""}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <StatusPill tone={shown.soilWorkable ? "good" : "risk"}>
                          {t("sidebar.regional.rainStatus", {
                            pct: shown.todayRainfallProbability,
                            status: shown.soilWorkable ? t("sidebar.regional.soilWorkable") : t("sidebar.regional.waitOnSoil"),
                          })}
                        </StatusPill>
                        <span aria-hidden="true" className="text-ink-faint">
                          {districtOpen ? "▾" : "▸"}
                        </span>
                      </span>
                    </button>
                    {districtOpen && (
                      <ul className="ml-1 space-y-1 border-l border-parchment-2 py-1 pl-3">
                        {sectorState?.loading && <li className="text-xs text-ink-faint">{t("sidebar.regional.loadingSectors")}</li>}
                        {sectorState?.error && <li className="text-xs text-ink-faint">{t("sidebar.regional.sectorUnavailable")}</li>}
                        {sectorState?.data?.map((sector) => (
                          <li key={sector.id} className="flex items-center justify-between gap-2 py-0.5 text-xs">
                            <span className="font-medium text-ink">{sector.name}</span>
                            <StatusPill tone={sector.weather.soilWorkable ? "good" : "risk"}>
                              {t("sidebar.regional.rainStatus", {
                                pct: sector.weather.todayRainfallProbability,
                                status: sector.weather.soilWorkable ? t("sidebar.regional.soilWorkable") : t("sidebar.regional.waitOnSoil"),
                              })}
                            </StatusPill>
                          </li>
                        ))}
                      </ul>
                    )}
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

"use client";

import { useCallback, useEffect, useState } from "react";
import type { CropSuggestionsResponse, CurrentCropResponse, ProvinceWeatherRollup, TodayWeatherResponse } from "@ihiga-lite/shared";
import { getTodayWeather, getProvinceWeather } from "../../../lib/weather-api";
import { getCropSuggestions, getCurrentCrop } from "../../../lib/crops-api";

export interface SidebarSectionState<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
}

const INITIAL_STATE = { data: null, loading: true, error: false };

/**
 * Fetches every sidebar section independently — one endpoint failing sets
 * only that section's `error` flag, it never blocks or breaks the others
 * (each has its own try/catch), and none of this touches ChatWidget's own
 * message/season/language state.
 *
 * The "Your crop" section gets its own effect (rather than living in the big
 * Promise.allSettled-style block below) because it's the one section that
 * needs to refetch on demand — right after the chat auto-extraction confirm
 * flow or the manual fallback form writes a new tracked crop, so the
 * sidebar/summary cards update without a full page reload. `cropRefreshSignal`
 * is bumped externally (ChatWidget, after any chat response); `refreshCurrentCrop`
 * is called directly by this sidebar's own manual-form path.
 */
export function useSidebarData(farmerId: string, cropRefreshSignal = 0) {
  const [todayWeather, setTodayWeather] = useState<SidebarSectionState<TodayWeatherResponse>>(INITIAL_STATE);
  const [provinceWeather, setProvinceWeather] = useState<SidebarSectionState<ProvinceWeatherRollup[]>>(INITIAL_STATE);
  const [cropSuggestions, setCropSuggestions] = useState<SidebarSectionState<CropSuggestionsResponse>>(INITIAL_STATE);
  const [currentCrop, setCurrentCrop] = useState<SidebarSectionState<CurrentCropResponse | null>>(INITIAL_STATE);
  const [manualRefreshKey, setManualRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getTodayWeather(farmerId)
      .then((data) => !cancelled && setTodayWeather({ data, loading: false, error: false }))
      .catch(() => !cancelled && setTodayWeather({ data: null, loading: false, error: true }));

    getProvinceWeather()
      .then((data) => !cancelled && setProvinceWeather({ data, loading: false, error: false }))
      .catch(() => !cancelled && setProvinceWeather({ data: null, loading: false, error: true }));

    getCropSuggestions(farmerId)
      .then((data) => !cancelled && setCropSuggestions({ data, loading: false, error: false }))
      .catch(() => !cancelled && setCropSuggestions({ data: null, loading: false, error: true }));

    return () => {
      cancelled = true;
    };
  }, [farmerId]);

  useEffect(() => {
    let cancelled = false;

    getCurrentCrop(farmerId)
      .then((data) => !cancelled && setCurrentCrop({ data, loading: false, error: false }))
      .catch(() => !cancelled && setCurrentCrop({ data: null, loading: false, error: true }));

    return () => {
      cancelled = true;
    };
  }, [farmerId, cropRefreshSignal, manualRefreshKey]);

  const refreshCurrentCrop = useCallback(() => setManualRefreshKey((key) => key + 1), []);

  return { todayWeather, provinceWeather, cropSuggestions, currentCrop, refreshCurrentCrop };
}

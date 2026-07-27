"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { AdminSector } from "@ihiga-lite/shared";

export interface SectorFormValues {
  district: string;
  name: string;
  nameRw: string;
  lat: string;
  lng: string;
  coordinatesApproximated: boolean;
}

function sectorToValues(sector: AdminSector | null, defaultDistrict: string): SectorFormValues {
  if (!sector) {
    return { district: defaultDistrict, name: "", nameRw: "", lat: "", lng: "", coordinatesApproximated: true };
  }
  return {
    district: sector.district,
    name: sector.name,
    nameRw: sector.nameRw ?? "",
    lat: String(sector.lat),
    lng: String(sector.lng),
    coordinatesApproximated: sector.coordinatesApproximated,
  };
}

export function SectorForm({
  sector,
  defaultDistrict,
  isSaving,
  errorMessage,
  onCancel,
  onSubmit,
}: {
  sector: AdminSector | null;
  defaultDistrict: string;
  isSaving: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (values: SectorFormValues) => void;
}) {
  const [values, setValues] = useState<SectorFormValues>(() => sectorToValues(sector, defaultDistrict));

  useEffect(() => {
    setValues(sectorToValues(sector, defaultDistrict));
  }, [sector, defaultDistrict]);

  function update<K extends keyof SectorFormValues>(key: K, value: SectorFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-soil/10 bg-white p-4 sm:p-6">
      <h2 className="text-base font-semibold text-ink">{sector ? "Edit sector" : "New sector"}</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">District</span>
          <input
            type="text"
            required
            value={values.district}
            onChange={(event) => update("district", event.target.value)}
            className="rounded-xl border border-soil/15 bg-parchment/60 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Sector name</span>
          <input
            type="text"
            required
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            className="rounded-xl border border-soil/15 bg-parchment/60 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Kinyarwanda name (optional)</span>
        <input
          type="text"
          value={values.nameRw}
          onChange={(event) => update("nameRw", event.target.value)}
          className="rounded-xl border border-soil/15 bg-parchment/60 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Latitude</span>
          <input
            type="text"
            required
            inputMode="decimal"
            value={values.lat}
            onChange={(event) => update("lat", event.target.value)}
            placeholder="e.g. -1.4495"
            className="rounded-xl border border-soil/15 bg-parchment/60 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-sage"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Longitude</span>
          <input
            type="text"
            required
            inputMode="decimal"
            value={values.lng}
            onChange={(event) => update("lng", event.target.value)}
            placeholder="e.g. 29.6335"
            className="rounded-xl border border-soil/15 bg-parchment/60 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-sage"
          />
        </label>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={values.coordinatesApproximated}
          onChange={(event) => update("coordinatesApproximated", event.target.checked)}
          className="h-4 w-4 rounded border-soil/30 text-sage focus:ring-sage"
        />
        <span className="text-sm text-ink">
          Coordinate is approximated (uncheck once this is a real, surveyed coordinate)
        </span>
      </label>

      {errorMessage && <p className="text-sm text-clay">{errorMessage}</p>}

      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-xl border border-soil/15 px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-parchment-3 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-sage px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : sector ? "Save changes" : "Create sector"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { CropOption, CurrentCropResponse } from "@ihiga-lite/shared";
import { getAllCrops, setCurrentCrop } from "../../../lib/crops-api";
import { EmptyStatePrompt } from "./EmptyStatePrompt";

/**
 * Manual fallback path (Phase 8.2) — always available regardless of whether
 * Groq's chat auto-extraction has ever fired for this farmer, since it makes
 * no assumption about conversation history. Tapping the empty state opens an
 * inline crop + planting-date form that writes directly (no confirm step,
 * unlike the chat flow) since this is a deliberate explicit farmer action.
 */
export function YourCropCard({
  data,
  loading,
  error,
  farmerId,
  onUpdated,
}: {
  data: CurrentCropResponse | null;
  loading: boolean;
  error: boolean;
  farmerId: string;
  onUpdated: () => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [crops, setCrops] = useState<CropOption[]>([]);
  const [cropsLoading, setCropsLoading] = useState(false);
  const [selectedCropId, setSelectedCropId] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    if (!formOpen || crops.length > 0) {
      return;
    }
    let cancelled = false;
    setCropsLoading(true);
    getAllCrops()
      .then((options) => {
        if (cancelled) return;
        setCrops(options);
        setSelectedCropId((current) => current || options[0]?.id || "");
      })
      .catch(() => !cancelled && setSubmitError(true))
      .finally(() => !cancelled && setCropsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [formOpen, crops.length]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedCropId || !plantingDate) {
      return;
    }
    setSubmitting(true);
    setSubmitError(false);
    try {
      await setCurrentCrop(farmerId, selectedCropId, plantingDate);
      setFormOpen(false);
      setPlantingDate("");
      onUpdated();
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-xs text-ink-faint">Loading your crop…</p>;
  }
  if (error) {
    return <p className="text-xs text-ink-faint">Crop status unavailable right now.</p>;
  }

  if (formOpen) {
    return (
      <form onSubmit={handleSubmit} className="space-y-2 rounded-2xl border border-white/50 bg-white/40 p-3 shadow-sm backdrop-blur-md">
        <label className="block text-xs font-medium text-ink-soft">
          Crop
          <select
            value={selectedCropId}
            onChange={(event) => setSelectedCropId(event.target.value)}
            disabled={cropsLoading}
            className="mt-1 w-full rounded-lg border border-white/60 bg-white/70 px-2 py-1.5 text-sm text-ink"
          >
            {crops.map((crop) => (
              <option key={crop.id} value={crop.id}>
                {crop.name} ({crop.localName})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-ink-soft">
          Planting date
          <input
            type="date"
            value={plantingDate}
            onChange={(event) => setPlantingDate(event.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-white/60 bg-white/70 px-2 py-1.5 text-sm text-ink"
          />
        </label>
        {submitError && <p className="text-xs text-red-600">Couldn&apos;t save that — try again.</p>}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={submitting || !selectedCropId || !plantingDate}
            className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-parchment disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            disabled={submitting}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-soft"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (!data) {
    return (
      <button type="button" onClick={() => setFormOpen(true)} className="block w-full text-left">
        <EmptyStatePrompt icon="📅" label="Add your planting date" />
      </button>
    );
  }

  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium text-ink">
        {data.cropName} <span className="text-ink-faint">({data.localName})</span>
      </p>
      <p className="text-ink-soft">
        Stage: {data.stage.name} (week {data.stage.weekStart}–{data.stage.weekEnd})
      </p>
      <p className="text-xs text-ink-faint">{data.stage.taskDescription}</p>
      <button type="button" onClick={() => setFormOpen(true)} className="text-xs font-medium text-ink-soft underline">
        Update
      </button>
    </div>
  );
}

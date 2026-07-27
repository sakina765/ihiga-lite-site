"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { AdminCrop } from "@ihiga-lite/shared";

export interface CropDetailsValues {
  name: string;
  localName: string;
  slug: string;
  description: string;
}

function cropToValues(crop: AdminCrop | null): CropDetailsValues {
  if (!crop) {
    return { name: "", localName: "", slug: "", description: "" };
  }
  return { name: crop.name, localName: crop.localName, slug: crop.slug, description: crop.description ?? "" };
}

export function CropDetailsForm({
  crop,
  isSaving,
  errorMessage,
  onSubmit,
}: {
  crop: AdminCrop | null;
  isSaving: boolean;
  errorMessage: string | null;
  onSubmit: (values: CropDetailsValues) => void;
}) {
  const [values, setValues] = useState<CropDetailsValues>(() => cropToValues(crop));

  useEffect(() => {
    setValues(cropToValues(crop));
  }, [crop]);

  function update<K extends keyof CropDetailsValues>(key: K, value: CropDetailsValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Name (English)</span>
          <input
            type="text"
            required
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            className="rounded-xl border border-soil/15 bg-parchment/60 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Name (Kinyarwanda)</span>
          <input
            type="text"
            required
            value={values.localName}
            onChange={(event) => update("localName", event.target.value)}
            className="rounded-xl border border-soil/15 bg-parchment/60 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Slug</span>
        <input
          type="text"
          required
          value={values.slug}
          onChange={(event) => update("slug", event.target.value)}
          placeholder="e.g. sweet-potato"
          className="rounded-xl border border-soil/15 bg-parchment/60 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-sage"
        />
        <span className="text-xs text-ink-faint">
          Lowercase, hyphen-separated — this is what Groq extracts from a farmer&apos;s message to match this crop.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Description (optional)</span>
        <textarea
          rows={2}
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          className="rounded-xl border border-soil/15 bg-parchment/60 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage"
        />
      </label>

      {errorMessage && <p className="text-sm text-clay">{errorMessage}</p>}

      <div>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-sage px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : crop ? "Save changes" : "Create crop"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { CropOption, KnowledgeFact } from "@ihiga-lite/shared";

export interface KnowledgeFactFormValues {
  cropId: string; // "" means no crop
  topic: string;
  factText: string;
  factTextRw: string;
  source: string;
  tags: string; // comma-separated in the UI, split on submit
}

function factToFormValues(fact: KnowledgeFact | null): KnowledgeFactFormValues {
  if (!fact) {
    return { cropId: "", topic: "", factText: "", factTextRw: "", source: "", tags: "" };
  }
  return {
    cropId: fact.cropId ?? "",
    topic: fact.topic,
    factText: fact.factText,
    factTextRw: fact.factTextRw ?? "",
    source: fact.source,
    tags: fact.tags.join(", "),
  };
}

/**
 * Deliberately a plain textarea for content, not a rich text editor — per
 * spec, this needs to be fast for an admin to use, not fancy. Shared between
 * create and edit: `editingFact === null` means create mode.
 */
export function KnowledgeFactFormPanel({
  crops,
  editingFact,
  isSaving,
  errorMessage,
  onCancel,
  onSubmit,
}: {
  crops: CropOption[];
  editingFact: KnowledgeFact | null;
  isSaving: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (values: KnowledgeFactFormValues) => void;
}) {
  const [values, setValues] = useState<KnowledgeFactFormValues>(() => factToFormValues(editingFact));

  // Re-seed the form whenever the target fact changes (switching from
  // creating to editing a specific row, or from editing one row to another)
  // — a plain useState initializer only runs once per mount, which wouldn't
  // pick up a later prop change.
  useEffect(() => {
    setValues(factToFormValues(editingFact));
  }, [editingFact]);

  function update<K extends keyof KnowledgeFactFormValues>(key: K, value: KnowledgeFactFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-soil/10 bg-white p-6">
      <h2 className="text-base font-semibold text-ink">{editingFact ? "Edit knowledge fact" : "New knowledge fact"}</h2>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Crop</span>
          <select
            value={values.cropId}
            onChange={(event) => update("cropId", event.target.value)}
            className="rounded-xl border border-soil/15 bg-parchment/60 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage"
          >
            <option value="">No crop (general)</option>
            {crops.map((crop) => (
              <option key={crop.id} value={crop.id}>
                {crop.name} ({crop.localName})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Topic</span>
          <input
            type="text"
            required
            value={values.topic}
            onChange={(event) => update("topic", event.target.value)}
            placeholder="e.g. fertilizer, pest, harvest"
            className="rounded-xl border border-soil/15 bg-parchment/60 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-sage"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Content (English)</span>
        <textarea
          required
          rows={4}
          value={values.factText}
          onChange={(event) => update("factText", event.target.value)}
          className="rounded-xl border border-soil/15 bg-parchment/60 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-sage"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Content (Kinyarwanda — optional)</span>
        <textarea
          rows={4}
          value={values.factTextRw}
          onChange={(event) => update("factTextRw", event.target.value)}
          className="rounded-xl border border-soil/15 bg-parchment/60 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-sage"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Source</span>
          <input
            type="text"
            required
            value={values.source}
            onChange={(event) => update("source", event.target.value)}
            placeholder="e.g. RICA fact sheet 2026"
            className="rounded-xl border border-soil/15 bg-parchment/60 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-sage"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Tags (comma-separated)</span>
          <input
            type="text"
            value={values.tags}
            onChange={(event) => update("tags", event.target.value)}
            placeholder="e.g. fertilizer, maize, topdressing"
            className="rounded-xl border border-soil/15 bg-parchment/60 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-sage"
          />
        </label>
      </div>

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
          {isSaving ? "Saving…" : editingFact ? "Save changes" : "Create fact"}
        </button>
      </div>
    </form>
  );
}

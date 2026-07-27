"use client";

import { useEffect, useState } from "react";
import type { AdminCropStage, CropStageInput } from "@ihiga-lite/shared";

function toInputRow(stage: AdminCropStage): CropStageInput {
  return {
    name: stage.name,
    weekStart: stage.weekStart,
    weekEnd: stage.weekEnd,
    taskDescription: stage.taskDescription,
    taskDescriptionRw: stage.taskDescriptionRw,
  };
}

const EMPTY_ROW: CropStageInput = { name: "", weekStart: 0, weekEnd: 0, taskDescription: "", taskDescriptionRw: "" };

/**
 * Edits a crop's ENTIRE stage timeline as one ordered table, saved atomically
 * via a single "Save stages" action (PUT /admin/crops/:id/stages) — matches
 * the backend's own replace-the-whole-list design (see
 * AdminReplaceCropStagesDto's doc comment), so there's no separate
 * add/remove/reorder API to keep in sync with row order here.
 */
export function CropStagesEditor({
  stages,
  isSaving,
  errorMessage,
  onSave,
}: {
  stages: AdminCropStage[];
  isSaving: boolean;
  errorMessage: string | null;
  onSave: (rows: CropStageInput[]) => void;
}) {
  const [rows, setRows] = useState<CropStageInput[]>(() => stages.map(toInputRow));

  useEffect(() => {
    setRows(stages.map(toInputRow));
  }, [stages]);

  function updateRow(index: number, patch: Partial<CropStageInput>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function moveRow(index: number, direction: -1 | 1) {
    setRows((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) {
        return prev;
      }
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Mobile: one card per stage — a 7-column editable table has no
          reasonable phone layout, even with horizontal scroll. */}
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row, index) => (
          <div key={index} className="rounded-xl border border-soil/10 bg-parchment/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">Stage {index + 1}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveRow(index, -1)}
                  disabled={index === 0}
                  aria-label="Move stage earlier"
                  className="rounded border border-soil/15 px-2 py-1 text-ink-soft disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveRow(index, 1)}
                  disabled={index === rows.length - 1}
                  aria-label="Move stage later"
                  className="rounded border border-soil/15 px-2 py-1 text-ink-soft disabled:opacity-30"
                >
                  ↓
                </button>
                <button type="button" onClick={() => removeRow(index)} className="text-sm font-medium text-clay hover:opacity-80">
                  Remove
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-ink-soft">Stage name</span>
                <input
                  type="text"
                  value={row.name}
                  onChange={(event) => updateRow(index, { name: event.target.value })}
                  className="w-full rounded-lg border border-soil/15 bg-white px-2 py-1.5 text-sm text-ink"
                />
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-ink-soft">Week start</span>
                  <input
                    type="number"
                    min={0}
                    value={row.weekStart}
                    onChange={(event) => updateRow(index, { weekStart: Number(event.target.value) })}
                    className="w-full rounded-lg border border-soil/15 bg-white px-2 py-1.5 text-sm text-ink"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-ink-soft">Week end</span>
                  <input
                    type="number"
                    min={0}
                    value={row.weekEnd}
                    onChange={(event) => updateRow(index, { weekEnd: Number(event.target.value) })}
                    className="w-full rounded-lg border border-soil/15 bg-white px-2 py-1.5 text-sm text-ink"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-ink-soft">Task (English)</span>
                <textarea
                  rows={2}
                  value={row.taskDescription}
                  onChange={(event) => updateRow(index, { taskDescription: event.target.value })}
                  className="w-full rounded-lg border border-soil/15 bg-white px-2 py-1.5 text-sm text-ink"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-ink-soft">Task (Kinyarwanda)</span>
                <textarea
                  rows={2}
                  value={row.taskDescriptionRw}
                  onChange={(event) => updateRow(index, { taskDescriptionRw: event.target.value })}
                  className="w-full rounded-lg border border-soil/15 bg-white px-2 py-1.5 text-sm text-ink"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-soil/10 md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-soil/10 text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-3 py-2 font-medium">Order</th>
              <th className="px-3 py-2 font-medium">Stage name</th>
              <th className="px-3 py-2 font-medium">Week start</th>
              <th className="px-3 py-2 font-medium">Week end</th>
              <th className="px-3 py-2 font-medium">Task (English)</th>
              <th className="px-3 py-2 font-medium">Task (Kinyarwanda)</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-soil/5 align-top last:border-0">
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveRow(index, -1)}
                      disabled={index === 0}
                      aria-label="Move stage earlier"
                      className="rounded border border-soil/15 px-1.5 text-ink-soft disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRow(index, 1)}
                      disabled={index === rows.length - 1}
                      aria-label="Move stage later"
                      className="rounded border border-soil/15 px-1.5 text-ink-soft disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(event) => updateRow(index, { name: event.target.value })}
                    className="w-40 rounded-lg border border-soil/15 bg-parchment/60 px-2 py-1.5 text-sm text-ink"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    value={row.weekStart}
                    onChange={(event) => updateRow(index, { weekStart: Number(event.target.value) })}
                    className="w-20 rounded-lg border border-soil/15 bg-parchment/60 px-2 py-1.5 text-sm text-ink"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    value={row.weekEnd}
                    onChange={(event) => updateRow(index, { weekEnd: Number(event.target.value) })}
                    className="w-20 rounded-lg border border-soil/15 bg-parchment/60 px-2 py-1.5 text-sm text-ink"
                  />
                </td>
                <td className="px-3 py-2">
                  <textarea
                    rows={2}
                    value={row.taskDescription}
                    onChange={(event) => updateRow(index, { taskDescription: event.target.value })}
                    className="w-48 rounded-lg border border-soil/15 bg-parchment/60 px-2 py-1.5 text-sm text-ink"
                  />
                </td>
                <td className="px-3 py-2">
                  <textarea
                    rows={2}
                    value={row.taskDescriptionRw}
                    onChange={(event) => updateRow(index, { taskDescriptionRw: event.target.value })}
                    className="w-48 rounded-lg border border-soil/15 bg-parchment/60 px-2 py-1.5 text-sm text-ink"
                  />
                </td>
                <td className="px-3 py-2">
                  <button type="button" onClick={() => removeRow(index)} className="text-sm font-medium text-clay hover:opacity-80">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {errorMessage && <p className="text-sm text-clay">{errorMessage}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          className="rounded-lg border border-soil/15 px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-parchment-3"
        >
          + Add stage
        </button>
        <button
          type="button"
          onClick={() => onSave(rows)}
          disabled={isSaving || rows.length === 0}
          className="rounded-lg bg-sage px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save stages"}
        </button>
      </div>
    </div>
  );
}

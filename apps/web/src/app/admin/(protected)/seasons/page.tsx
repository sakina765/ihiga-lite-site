"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminSeasonBoundary } from "@ihiga-lite/shared";
import { listSeasonBoundaries, updateSeasonBoundary } from "../../../../lib/admin-season-api";

type EditableBoundary = AdminSeasonBoundary;

export default function AdminSeasonsPage() {
  const [boundaries, setBoundaries] = useState<EditableBoundary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setListError(null);
    try {
      setBoundaries(await listSeasonBoundaries());
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Failed to load season boundaries");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function updateField(code: string, patch: Partial<EditableBoundary>) {
    setBoundaries((prev) => prev.map((b) => (b.code === code ? { ...b, ...patch } : b)));
  }

  async function handleSave(boundary: EditableBoundary) {
    setSavingCode(boundary.code);
    setRowErrors((prev) => ({ ...prev, [boundary.code]: "" }));
    try {
      const updated = await updateSeasonBoundary(boundary.code, {
        localName: boundary.localName,
        englishName: boundary.englishName,
        startMonth: boundary.startMonth,
        startDay: boundary.startDay,
        endMonth: boundary.endMonth,
        endDay: boundary.endDay,
      });
      setBoundaries((prev) => prev.map((b) => (b.code === boundary.code ? updated : b)));
      setToast(`Season ${boundary.code} updated.`);
    } catch (error) {
      setRowErrors((prev) => ({ ...prev, [boundary.code]: error instanceof Error ? error.message : "Save failed" }));
    } finally {
      setSavingCode(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Seasons</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Rwanda&apos;s Season A/B/C date ranges — every chat reply&apos;s season context comes from these 3 rows.
          There is no &quot;add a season&quot; here; only these 3 can be edited.
        </p>
      </div>

      {toast && <div className="rounded-xl bg-sage/15 px-4 py-2.5 text-sm font-medium text-sage-dark">{toast}</div>}
      {listError && <p className="text-sm text-clay">{listError}</p>}
      {isLoading && <p className="text-sm text-ink-faint">Loading…</p>}

      <div className="flex flex-col gap-4">
        {boundaries.map((boundary) => (
          <div key={boundary.code} className="rounded-2xl border border-soil/10 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-ink">Season {boundary.code}</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">Local name</span>
                <input
                  type="text"
                  value={boundary.localName}
                  onChange={(event) => updateField(boundary.code, { localName: event.target.value })}
                  className="rounded-xl border border-soil/15 bg-parchment/60 px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">English name</span>
                <input
                  type="text"
                  value={boundary.englishName}
                  onChange={(event) => updateField(boundary.code, { englishName: event.target.value })}
                  className="rounded-xl border border-soil/15 bg-parchment/60 px-3 py-2 text-sm text-ink"
                />
              </label>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-soft">Start month</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={boundary.startMonth}
                  onChange={(event) => updateField(boundary.code, { startMonth: Number(event.target.value) })}
                  className="rounded-lg border border-soil/15 bg-parchment/60 px-3 py-1.5 text-sm text-ink"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-soft">Start day</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={boundary.startDay}
                  onChange={(event) => updateField(boundary.code, { startDay: Number(event.target.value) })}
                  className="rounded-lg border border-soil/15 bg-parchment/60 px-3 py-1.5 text-sm text-ink"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-soft">End month</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={boundary.endMonth}
                  onChange={(event) => updateField(boundary.code, { endMonth: Number(event.target.value) })}
                  className="rounded-lg border border-soil/15 bg-parchment/60 px-3 py-1.5 text-sm text-ink"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-soft">End day</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={boundary.endDay}
                  onChange={(event) => updateField(boundary.code, { endDay: Number(event.target.value) })}
                  className="rounded-lg border border-soil/15 bg-parchment/60 px-3 py-1.5 text-sm text-ink"
                />
              </label>
            </div>

            {rowErrors[boundary.code] && <p className="mt-3 text-sm text-clay">{rowErrors[boundary.code]}</p>}

            <div className="mt-4">
              <button
                onClick={() => handleSave(boundary)}
                disabled={savingCode === boundary.code}
                className="rounded-xl bg-sage px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingCode === boundary.code ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

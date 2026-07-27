"use client";

import { useCallback, useEffect, useState } from "react";
import type { CropOption, KnowledgeFact } from "@ihiga-lite/shared";
import { getAllCrops } from "../../../../lib/crops-api";
import {
  createKnowledgeFact,
  deleteKnowledgeFact,
  listKnowledgeFacts,
  markKnowledgeFactReviewed,
  updateKnowledgeFact,
} from "../../../../lib/admin-knowledge-api";
import { KnowledgeFactFormPanel, type KnowledgeFactFormValues } from "../../../../components/admin/knowledge/KnowledgeFactFormPanel";
import { ConfirmDialog } from "../../../../components/admin/ConfirmDialog";

type ReviewedFilter = "all" | "true" | "false";

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function AdminKnowledgePage() {
  const [crops, setCrops] = useState<CropOption[]>([]);
  const [facts, setFacts] = useState<KnowledgeFact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [filterCropId, setFilterCropId] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [filterReviewed, setFilterReviewed] = useState<ReviewedFilter>("all");

  const [formMode, setFormMode] = useState<"closed" | "create" | "edit">("closed");
  const [editingFact, setEditingFact] = useState<KnowledgeFact | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<KnowledgeFact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadFacts = useCallback(async () => {
    setIsLoading(true);
    setListError(null);
    try {
      const data = await listKnowledgeFacts({
        cropId: filterCropId || undefined,
        topic: filterTopic || undefined,
        reviewed: filterReviewed === "all" ? undefined : filterReviewed,
      });
      setFacts(data);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Failed to load knowledge facts");
    } finally {
      setIsLoading(false);
    }
  }, [filterCropId, filterTopic, filterReviewed]);

  useEffect(() => {
    getAllCrops()
      .then(setCrops)
      .catch(() => setCrops([]));
  }, []);

  useEffect(() => {
    loadFacts();
  }, [loadFacts]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function openCreateForm() {
    setEditingFact(null);
    setFormError(null);
    setFormMode("create");
  }

  function openEditForm(fact: KnowledgeFact) {
    setEditingFact(fact);
    setFormError(null);
    setFormMode("edit");
  }

  function closeForm() {
    setFormMode("closed");
    setEditingFact(null);
    setFormError(null);
  }

  async function handleFormSubmit(values: KnowledgeFactFormValues) {
    setIsSaving(true);
    setFormError(null);
    try {
      if (formMode === "edit" && editingFact) {
        await updateKnowledgeFact(editingFact.id, {
          cropId: values.cropId || null,
          topic: values.topic,
          factText: values.factText,
          factTextRw: values.factTextRw || null,
          source: values.source,
          tags: parseTags(values.tags),
        });
        setToast("Fact updated.");
      } else {
        await createKnowledgeFact({
          cropId: values.cropId || undefined,
          topic: values.topic,
          factText: values.factText,
          factTextRw: values.factTextRw || undefined,
          source: values.source,
          tags: parseTags(values.tags),
        });
        setToast("Fact created.");
      }
      closeForm();
      await loadFacts();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleMarkReviewed(fact: KnowledgeFact) {
    setReviewingId(fact.id);
    try {
      await markKnowledgeFactReviewed(fact.id);
      setToast("Marked as reviewed.");
      await loadFacts();
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Failed to mark as reviewed");
    } finally {
      setReviewingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteKnowledgeFact(deleteTarget.id);
      setToast("Fact deleted.");
      setDeleteTarget(null);
      await loadFacts();
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Knowledge base</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Facts grounding the chatbot&apos;s answers. Anything not yet marked reviewed is placeholder content pending
            RICA validation.
          </p>
        </div>
        {formMode === "closed" && (
          <button
            onClick={openCreateForm}
            className="rounded-xl bg-sage px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-dark sm:self-start"
          >
            + New fact
          </button>
        )}
      </div>

      {toast && <div className="rounded-xl bg-sage/15 px-4 py-2.5 text-sm font-medium text-sage-dark">{toast}</div>}

      {formMode !== "closed" && (
        <KnowledgeFactFormPanel
          crops={crops}
          editingFact={formMode === "edit" ? editingFact : null}
          isSaving={isSaving}
          errorMessage={formError}
          onCancel={closeForm}
          onSubmit={handleFormSubmit}
        />
      )}

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-soil/10 bg-white p-4">
        <label className="flex w-full flex-col gap-1.5 sm:w-auto">
          <span className="text-xs font-medium text-ink-soft">Crop</span>
          <select
            value={filterCropId}
            onChange={(event) => setFilterCropId(event.target.value)}
            className="w-full rounded-lg border border-soil/15 bg-parchment/60 px-3 py-1.5 text-sm text-ink sm:w-auto"
          >
            <option value="">All crops</option>
            {crops.map((crop) => (
              <option key={crop.id} value={crop.id}>
                {crop.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex w-full flex-col gap-1.5 sm:w-auto">
          <span className="text-xs font-medium text-ink-soft">Topic</span>
          <input
            type="text"
            value={filterTopic}
            onChange={(event) => setFilterTopic(event.target.value)}
            placeholder="exact topic, e.g. fertilizer"
            className="w-full rounded-lg border border-soil/15 bg-parchment/60 px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint sm:w-auto"
          />
        </label>

        <label className="flex w-full flex-col gap-1.5 sm:w-auto">
          <span className="text-xs font-medium text-ink-soft">Status</span>
          <select
            value={filterReviewed}
            onChange={(event) => setFilterReviewed(event.target.value as ReviewedFilter)}
            className="w-full rounded-lg border border-soil/15 bg-parchment/60 px-3 py-1.5 text-sm text-ink sm:w-auto"
          >
            <option value="all">All</option>
            <option value="false">Unreviewed only</option>
            <option value="true">Reviewed only</option>
          </select>
        </label>
      </div>

      {listError && <p className="text-sm text-clay">{listError}</p>}

      {/* Mobile: one card per fact — a horizontally-scrolling 5-column table
          is not a reasonable phone experience. Desktop keeps the table below. */}
      <div className="flex flex-col gap-3 md:hidden">
        {isLoading && <p className="py-6 text-center text-sm text-ink-faint">Loading…</p>}
        {!isLoading && facts.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-faint">No knowledge facts match these filters.</p>
        )}
        {!isLoading &&
          facts.map((fact) => (
            <div key={fact.id} className="rounded-2xl border border-soil/10 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-ink">{fact.topic}</div>
                  <div className="text-xs text-ink-faint">{fact.crop ? fact.crop.name : "General (no crop)"}</div>
                </div>
                {fact.reviewed ? (
                  <span className="shrink-0 rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-sage-dark">Reviewed</span>
                ) : (
                  <span className="shrink-0 rounded-full bg-clay/15 px-2.5 py-1 text-xs font-medium text-clay">Placeholder</span>
                )}
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{fact.factText}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-soil/5 pt-3 text-sm">
                <button onClick={() => openEditForm(fact)} className="font-medium text-ink-soft hover:text-ink">
                  Edit
                </button>
                {!fact.reviewed && (
                  <button
                    onClick={() => handleMarkReviewed(fact)}
                    disabled={reviewingId === fact.id}
                    className="font-medium text-sage-dark hover:opacity-80 disabled:opacity-50"
                  >
                    {reviewingId === fact.id ? "Marking…" : "Mark reviewed"}
                  </button>
                )}
                <button onClick={() => setDeleteTarget(fact)} className="font-medium text-clay hover:opacity-80">
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-soil/10 bg-white md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-soil/10 text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3 font-medium">Topic</th>
              <th className="px-4 py-3 font-medium">Crop</th>
              <th className="px-4 py-3 font-medium">Content</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-faint">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && facts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-faint">
                  No knowledge facts match these filters.
                </td>
              </tr>
            )}
            {!isLoading &&
              facts.map((fact) => (
                <tr key={fact.id} className="border-b border-soil/5 last:border-0">
                  <td className="px-4 py-3 align-top font-medium text-ink">{fact.topic}</td>
                  <td className="px-4 py-3 align-top text-ink-soft">{fact.crop ? fact.crop.name : "—"}</td>
                  <td className="max-w-md px-4 py-3 align-top text-ink-soft">
                    <span className="line-clamp-2" title={fact.factText}>
                      {fact.factText}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {fact.reviewed ? (
                      <span className="rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-sage-dark">Reviewed</span>
                    ) : (
                      <span className="rounded-full bg-clay/15 px-2.5 py-1 text-xs font-medium text-clay">
                        Placeholder / unvalidated
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-top">
                    <div className="flex gap-3 text-sm">
                      <button onClick={() => openEditForm(fact)} className="font-medium text-ink-soft hover:text-ink">
                        Edit
                      </button>
                      {!fact.reviewed && (
                        <button
                          onClick={() => handleMarkReviewed(fact)}
                          disabled={reviewingId === fact.id}
                          className="font-medium text-sage-dark hover:opacity-80 disabled:opacity-50"
                        >
                          {reviewingId === fact.id ? "Marking…" : "Mark reviewed"}
                        </button>
                      )}
                      <button onClick={() => setDeleteTarget(fact)} className="font-medium text-clay hover:opacity-80">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this knowledge fact?"
        body={
          deleteTarget
            ? `"${deleteTarget.factText.slice(0, 120)}${deleteTarget.factText.length > 120 ? "…" : ""}" will no longer be retrievable by the chatbot. This can't be undone.`
            : ""
        }
        isBusy={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

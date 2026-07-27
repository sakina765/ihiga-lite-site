"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminCrop, CropStageInput } from "@ihiga-lite/shared";
import {
  createCrop,
  deleteCrop,
  getCropImpact,
  listAdminCrops,
  replaceCropStages,
  updateCrop,
} from "../../../../lib/admin-crops-api";
import { CropDetailsForm, type CropDetailsValues } from "../../../../components/admin/crops/CropDetailsForm";
import { CropStagesEditor } from "../../../../components/admin/crops/CropStagesEditor";
import { ConfirmDialog } from "../../../../components/admin/ConfirmDialog";

export default function AdminCropsPage() {
  const [crops, setCrops] = useState<AdminCrop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedCropId, setSelectedCropId] = useState<string | "new" | null>(null);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [isSavingStages, setIsSavingStages] = useState(false);
  const [stagesError, setStagesError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminCrop | null>(null);
  const [deleteImpactCount, setDeleteImpactCount] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  const loadCrops = useCallback(async () => {
    setIsLoading(true);
    setListError(null);
    try {
      const data = await listAdminCrops();
      setCrops(data);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Failed to load crops");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCrops();
  }, [loadCrops]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const selectedCrop = selectedCropId && selectedCropId !== "new" ? crops.find((c) => c.id === selectedCropId) ?? null : null;

  async function handleDetailsSubmit(values: CropDetailsValues) {
    setIsSavingDetails(true);
    setDetailsError(null);
    try {
      const body = {
        name: values.name,
        localName: values.localName,
        slug: values.slug,
        description: values.description || undefined,
      };
      if (selectedCrop) {
        await updateCrop(selectedCrop.id, body);
        setToast("Crop updated.");
      } else {
        const created = await createCrop(body);
        setToast("Crop created — add its stages below.");
        setSelectedCropId(created.id);
      }
      await loadCrops();
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSavingDetails(false);
    }
  }

  async function handleStagesSave(rows: CropStageInput[]) {
    if (!selectedCrop) {
      return;
    }
    setIsSavingStages(true);
    setStagesError(null);
    try {
      await replaceCropStages(selectedCrop.id, rows);
      setToast("Stages saved.");
      await loadCrops();
    } catch (error) {
      setStagesError(error instanceof Error ? error.message : "Failed to save stages");
    } finally {
      setIsSavingStages(false);
    }
  }

  async function openDeleteConfirm(crop: AdminCrop) {
    setDeleteTarget(crop);
    setDeleteImpactCount(null);
    try {
      const impact = await getCropImpact(crop.id);
      setDeleteImpactCount(impact.trackingConversationsCount);
    } catch {
      setDeleteImpactCount(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteCrop(deleteTarget.id);
      setToast("Crop deleted.");
      if (selectedCropId === deleteTarget.id) {
        setSelectedCropId(null);
      }
      setDeleteTarget(null);
      await loadCrops();
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Crops &amp; stages</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Crop names, slugs, and per-crop growth-stage timing (days from planting) — previously required a code deploy
          to change.
        </p>
      </div>

      {toast && <div className="rounded-xl bg-sage/15 px-4 py-2.5 text-sm font-medium text-sage-dark">{toast}</div>}
      {listError && <p className="text-sm text-clay">{listError}</p>}

      <div className="grid grid-cols-[280px_1fr] gap-6">
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setSelectedCropId("new")}
            className="rounded-xl bg-sage px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-dark"
          >
            + New crop
          </button>

          <div className="overflow-hidden rounded-2xl border border-soil/10 bg-white">
            {isLoading && <div className="px-4 py-3 text-sm text-ink-faint">Loading…</div>}
            {!isLoading &&
              crops.map((crop) => (
                <div
                  key={crop.id}
                  className={`flex items-center justify-between border-b border-soil/5 px-4 py-3 last:border-0 ${
                    selectedCropId === crop.id ? "bg-sage/10" : ""
                  }`}
                >
                  <button onClick={() => setSelectedCropId(crop.id)} className="flex-1 text-left">
                    <div className="text-sm font-medium text-ink">{crop.name}</div>
                    <div className="text-xs text-ink-faint">
                      {crop.slug} · {crop.stages.length} stage{crop.stages.length === 1 ? "" : "s"}
                    </div>
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(crop)}
                    className="ml-2 text-xs font-medium text-clay hover:opacity-80"
                  >
                    Delete
                  </button>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-2xl border border-soil/10 bg-white p-6">
          {selectedCropId === null && <p className="text-sm text-ink-faint">Select a crop, or create a new one.</p>}

          {selectedCropId !== null && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="mb-3 text-base font-semibold text-ink">{selectedCrop ? "Crop details" : "New crop"}</h2>
                <CropDetailsForm
                  crop={selectedCrop}
                  isSaving={isSavingDetails}
                  errorMessage={detailsError}
                  onSubmit={handleDetailsSubmit}
                />
              </div>

              {selectedCrop && (
                <div>
                  <h2 className="mb-3 text-base font-semibold text-ink">Growth stages</h2>
                  <CropStagesEditor
                    stages={selectedCrop.stages}
                    isSaving={isSavingStages}
                    errorMessage={stagesError}
                    onSave={handleStagesSave}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name ?? ""}"?`}
        body={
          deleteImpactCount === null
            ? "Checking how many farmers currently track this crop…"
            : deleteImpactCount > 0
              ? `${deleteImpactCount} conversation${deleteImpactCount === 1 ? "" : "s"} currently tracking this crop will lose their stage info. This can't be undone.`
              : "No farmers are currently tracking this crop. This can't be undone."
        }
        isBusy={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

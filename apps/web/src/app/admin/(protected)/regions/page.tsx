"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminDistrictItem, AdminSector } from "@ihiga-lite/shared";
import { listAdminDistricts } from "../../../../lib/admin-districts-api";
import {
  createSector,
  deleteSector,
  getSectorImpact,
  listAdminSectors,
  updateSector,
} from "../../../../lib/admin-sectors-api";
import { SectorForm, type SectorFormValues } from "../../../../components/admin/regions/SectorForm";
import { ConfirmDialog } from "../../../../components/admin/ConfirmDialog";

export default function AdminRegionsPage() {
  const [districts, setDistricts] = useState<AdminDistrictItem[]>([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(true);
  const [districtsError, setDistrictsError] = useState<string | null>(null);

  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [sectors, setSectors] = useState<AdminSector[]>([]);
  const [isLoadingSectors, setIsLoadingSectors] = useState(false);
  const [sectorsError, setSectorsError] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<"closed" | "create" | "edit">("closed");
  const [editingSector, setEditingSector] = useState<AdminSector | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminSector | null>(null);
  const [deleteImpactCount, setDeleteImpactCount] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    listAdminDistricts()
      .then((data) => {
        setDistricts(data);
        if (data.length > 0) {
          setSelectedDistrict(data[0].district);
        }
      })
      .catch((err) => setDistrictsError(err instanceof Error ? err.message : "Failed to load districts"))
      .finally(() => setIsLoadingDistricts(false));
  }, []);

  const loadSectors = useCallback(async (district: string) => {
    if (!district) {
      setSectors([]);
      return;
    }
    setIsLoadingSectors(true);
    setSectorsError(null);
    try {
      setSectors(await listAdminSectors(district));
    } catch (err) {
      setSectorsError(err instanceof Error ? err.message : "Failed to load sectors");
    } finally {
      setIsLoadingSectors(false);
    }
  }, []);

  useEffect(() => {
    loadSectors(selectedDistrict);
  }, [selectedDistrict, loadSectors]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function openCreateForm() {
    setEditingSector(null);
    setFormError(null);
    setFormMode("create");
  }

  function openEditForm(sector: AdminSector) {
    setEditingSector(sector);
    setFormError(null);
    setFormMode("edit");
  }

  function closeForm() {
    setFormMode("closed");
    setEditingSector(null);
    setFormError(null);
  }

  async function handleFormSubmit(values: SectorFormValues) {
    const lat = Number(values.lat);
    const lng = Number(values.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setFormError("Latitude and longitude must be numbers");
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      const body = {
        district: values.district,
        name: values.name,
        nameRw: values.nameRw || undefined,
        lat,
        lng,
        coordinatesApproximated: values.coordinatesApproximated,
      };
      if (formMode === "edit" && editingSector) {
        await updateSector(editingSector.id, body);
        setToast("Sector updated.");
      } else {
        await createSector(body);
        setToast("Sector created.");
      }
      closeForm();
      await loadSectors(selectedDistrict);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function openDeleteConfirm(sector: AdminSector) {
    setDeleteTarget(sector);
    setDeleteImpactCount(null);
    try {
      const impact = await getSectorImpact(sector.id);
      setDeleteImpactCount(impact.trackingFarmersCount);
    } catch {
      setDeleteImpactCount(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteSector(deleteTarget.id);
      setToast("Sector deleted.");
      setDeleteTarget(null);
      await loadSectors(selectedDistrict);
    } catch (err) {
      setSectorsError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-ink">Regions</h1>
        <p className="mt-1 text-sm text-ink-soft">Rwanda&apos;s location hierarchy used for weather lookups and the onboarding location picker.</p>
      </div>

      {toast && <div className="rounded-xl bg-sage/15 px-4 py-2.5 text-sm font-medium text-sage-dark">{toast}</div>}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Districts</h2>
          <p className="text-xs text-ink-faint">
            Read-only — district (and province) coordinates are defined in code (used for district-level weather
            lookups), not a database table, so changing them needs a code deploy. Sector coordinates below are the
            editable level.
          </p>
        </div>
        {districtsError && <p className="text-sm text-clay">{districtsError}</p>}

        {/* Mobile: one row per district, grouped visually by keeping province + district on one line. */}
        <div className="flex flex-col gap-1 rounded-2xl border border-soil/10 bg-white p-2 md:hidden">
          {isLoadingDistricts && <p className="px-2 py-3 text-center text-sm text-ink-faint">Loading…</p>}
          {!isLoadingDistricts &&
            districts.map((row) => (
              <div key={row.district} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm">
                <div className="min-w-0">
                  <div className="text-ink">{row.district}</div>
                  <div className="text-xs text-ink-faint">{row.province ?? "—"}</div>
                </div>
                <div className="shrink-0 text-right text-xs text-ink-faint">
                  {row.lat}, {row.lon}
                </div>
              </div>
            ))}
        </div>

        <div className="hidden overflow-x-auto rounded-2xl border border-soil/10 bg-white md:block">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead className="border-b border-soil/10 text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-2 font-medium">Province</th>
                <th className="px-4 py-2 font-medium">District</th>
                <th className="px-4 py-2 font-medium">Latitude</th>
                <th className="px-4 py-2 font-medium">Longitude</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingDistricts && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-ink-faint">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoadingDistricts &&
                districts.map((row) => (
                  <tr key={row.district} className="border-b border-soil/5 last:border-0">
                    <td className="px-4 py-2 text-ink-soft">{row.province ?? "—"}</td>
                    <td className="px-4 py-2 text-ink">{row.district}</td>
                    <td className="px-4 py-2 text-ink-soft">{row.lat}</td>
                    <td className="px-4 py-2 text-ink-soft">{row.lon}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">Sectors</h2>
            <p className="text-xs text-ink-faint">
              Editable — replace a seed-time approximated coordinate with a real surveyed one, without a deploy.
            </p>
          </div>
          {formMode === "closed" && (
            <button
              onClick={openCreateForm}
              className="rounded-xl bg-sage px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-dark sm:self-start"
            >
              + New sector
            </button>
          )}
        </div>

        <label className="flex w-full flex-col gap-1.5 sm:w-64">
          <span className="text-xs font-medium text-ink-soft">District</span>
          <select
            value={selectedDistrict}
            onChange={(event) => setSelectedDistrict(event.target.value)}
            className="rounded-lg border border-soil/15 bg-white px-3 py-1.5 text-sm text-ink"
          >
            {districts.map((row) => (
              <option key={row.district} value={row.district}>
                {row.district}
              </option>
            ))}
          </select>
        </label>

        {formMode !== "closed" && (
          <SectorForm
            sector={formMode === "edit" ? editingSector : null}
            defaultDistrict={selectedDistrict}
            isSaving={isSaving}
            errorMessage={formError}
            onCancel={closeForm}
            onSubmit={handleFormSubmit}
          />
        )}

        {sectorsError && <p className="text-sm text-clay">{sectorsError}</p>}

        {/* Mobile: one card per sector. */}
        <div className="flex flex-col gap-3 md:hidden">
          {isLoadingSectors && <p className="py-6 text-center text-sm text-ink-faint">Loading…</p>}
          {!isLoadingSectors && sectors.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-faint">No sectors for this district.</p>
          )}
          {!isLoadingSectors &&
            sectors.map((sector) => (
              <div key={sector.id} className="rounded-2xl border border-soil/10 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-ink">{sector.name}</div>
                    {sector.nameRw && <div className="text-xs text-ink-faint">{sector.nameRw}</div>}
                  </div>
                  {sector.coordinatesApproximated ? (
                    <span className="shrink-0 rounded-full bg-clay/15 px-2.5 py-1 text-xs font-medium text-clay">Approximated</span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-sage-dark">Surveyed</span>
                  )}
                </div>
                <div className="mt-1.5 text-xs text-ink-faint">
                  {sector.lat}, {sector.lng}
                </div>
                <div className="mt-3 flex gap-4 border-t border-soil/5 pt-3 text-sm">
                  <button onClick={() => openEditForm(sector)} className="font-medium text-ink-soft hover:text-ink">
                    Edit
                  </button>
                  <button onClick={() => openDeleteConfirm(sector)} className="font-medium text-clay hover:opacity-80">
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
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Kinyarwanda</th>
                <th className="px-4 py-3 font-medium">Latitude</th>
                <th className="px-4 py-3 font-medium">Longitude</th>
                <th className="px-4 py-3 font-medium">Coordinate</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {isLoadingSectors && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink-faint">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoadingSectors && sectors.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink-faint">
                    No sectors for this district.
                  </td>
                </tr>
              )}
              {!isLoadingSectors &&
                sectors.map((sector) => (
                  <tr key={sector.id} className="border-b border-soil/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{sector.name}</td>
                    <td className="px-4 py-3 text-ink-soft">{sector.nameRw ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{sector.lat}</td>
                    <td className="px-4 py-3 text-ink-soft">{sector.lng}</td>
                    <td className="px-4 py-3">
                      {sector.coordinatesApproximated ? (
                        <span className="rounded-full bg-clay/15 px-2.5 py-1 text-xs font-medium text-clay">Approximated</span>
                      ) : (
                        <span className="rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-sage-dark">Surveyed</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex justify-end gap-3 text-sm">
                        <button onClick={() => openEditForm(sector)} className="font-medium text-ink-soft hover:text-ink">
                          Edit
                        </button>
                        <button onClick={() => openDeleteConfirm(sector)} className="font-medium text-clay hover:opacity-80">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name ?? ""}"?`}
        body={
          deleteImpactCount === null
            ? "Checking how many farmers are linked to this sector…"
            : deleteImpactCount > 0
              ? `${deleteImpactCount} farmer${deleteImpactCount === 1 ? "" : "s"} currently linked to this sector will keep a reference to an id that no longer exists. This can't be undone.`
              : "No farmers are currently linked to this sector. This can't be undone."
        }
        isBusy={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

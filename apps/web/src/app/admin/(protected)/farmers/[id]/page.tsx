"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { AdminFarmerDetailResponse } from "@ihiga-lite/shared";
import { deactivateFarmer, getAdminFarmerDetail, reactivateFarmer } from "../../../../../lib/admin-farmers-api";
import { MaskedPhoneNumber } from "../../../../../components/admin/farmers/MaskedPhoneNumber";
import { ConfirmDialog } from "../../../../../components/admin/ConfirmDialog";

const LANGUAGE_LABELS: Record<string, string> = { en: "English", rw: "Kinyarwanda", fr: "French" };

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminFarmerDetailPage() {
  const params = useParams<{ id: string }>();
  const farmerId = params.id;

  const [detail, setDetail] = useState<AdminFarmerDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setDetail(await getAdminFarmerDetail(farmerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load farmer");
    } finally {
      setIsLoading(false);
    }
  }, [farmerId]);

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

  const isDeactivated = !!detail?.farmer.deactivatedAt;

  async function handleConfirmToggle() {
    setIsBusy(true);
    try {
      const updated = isDeactivated ? await reactivateFarmer(farmerId) : await deactivateFarmer(farmerId);
      setDetail((prev) => (prev ? { ...prev, farmer: updated } : prev));
      setToast(isDeactivated ? "Account reactivated." : "Account deactivated.");
      setIsConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-ink-faint">Loading…</p>;
  }

  if (error && !detail) {
    return <p className="text-sm text-clay">{error}</p>;
  }

  if (!detail) {
    return null;
  }

  const { farmer, sector, conversations } = detail;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/farmers" className="text-sm font-medium text-ink-soft hover:text-ink">
          ← Back to farmers
        </Link>
      </div>

      {toast && <div className="rounded-xl bg-sage/15 px-4 py-2.5 text-sm font-medium text-sage-dark">{toast}</div>}
      {error && <p className="text-sm text-clay">{error}</p>}

      <div className="rounded-2xl border border-soil/10 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink">
              <MaskedPhoneNumber phoneNumber={farmer.phoneNumber} />
            </h1>
            <p className="mt-1 text-sm text-ink-soft">Registered {formatDateTime(farmer.createdAt)}</p>
          </div>
          {isDeactivated ? (
            <span className="rounded-full bg-clay/15 px-3 py-1 text-xs font-medium text-clay">Deactivated</span>
          ) : (
            <span className="rounded-full bg-sage/15 px-3 py-1 text-xs font-medium text-sage-dark">Active</span>
          )}
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-ink-faint">Region (district)</dt>
            <dd className="mt-0.5 text-ink">{farmer.district ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-faint">Sector</dt>
            <dd className="mt-0.5 text-ink">{sector ? `${sector.name}${sector.nameRw ? ` (${sector.nameRw})` : ""}` : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-faint">Village</dt>
            <dd className="mt-0.5 text-ink">{farmer.villageText ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-faint">Language</dt>
            <dd className="mt-0.5 text-ink">
              {farmer.preferredLanguage ? LANGUAGE_LABELS[farmer.preferredLanguage] ?? farmer.preferredLanguage : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-faint">Farm plot (device GPS)</dt>
            <dd className="mt-0.5 text-ink">
              {farmer.farmLatitude != null && farmer.farmLongitude != null ? `${farmer.farmLatitude}, ${farmer.farmLongitude}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-faint">Resolved farm coordinate</dt>
            <dd className="mt-0.5 text-ink">
              {farmer.resolvedLatitude != null && farmer.resolvedLongitude != null
                ? `${farmer.resolvedLatitude}, ${farmer.resolvedLongitude}`
                : "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <button
            onClick={() => setIsConfirmOpen(true)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
              isDeactivated ? "bg-sage hover:bg-sage-dark" : "bg-clay hover:bg-clay/90"
            }`}
          >
            {isDeactivated ? "Reactivate account" : "Deactivate account"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-soil/10 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Conversations</h2>
        <p className="mb-4 text-xs text-ink-faint">Click a conversation to view its full message thread.</p>
        {conversations.length === 0 ? (
          <p className="text-sm text-ink-faint">No conversations yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-soil/10">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-soil/10 text-xs uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="px-3 py-2 font-medium">Started</th>
                  <th className="px-3 py-2 font-medium">Language</th>
                  <th className="px-3 py-2 font-medium">Crop</th>
                  <th className="px-3 py-2 font-medium">Messages</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {conversations.map((conversation) => (
                  <tr key={conversation.id} className="border-b border-soil/5 last:border-0 hover:bg-parchment/40">
                    <td className="px-3 py-2 text-ink-soft">{formatDateTime(conversation.createdAt)}</td>
                    <td className="px-3 py-2 text-ink-soft">
                      {conversation.language ? LANGUAGE_LABELS[conversation.language] ?? conversation.language : "—"}
                    </td>
                    <td className="px-3 py-2 text-ink-soft">{conversation.cropName ?? "—"}</td>
                    <td className="px-3 py-2 text-ink-soft">{conversation.messageCount}</td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/admin/conversations/${conversation.id}`}
                        className="text-sm font-medium text-sage-dark hover:opacity-80"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        title={isDeactivated ? "Reactivate this account?" : "Deactivate this account?"}
        body={
          isDeactivated
            ? "The farmer will be able to chat and receive SMS alerts again."
            : "The farmer's next message will get a deactivation notice instead of a real reply, and they'll be skipped from SMS alerts. Their existing conversation history is kept, not deleted."
        }
        confirmLabel={isDeactivated ? "Reactivate" : "Deactivate"}
        isBusy={isBusy}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmToggle}
      />
    </div>
  );
}

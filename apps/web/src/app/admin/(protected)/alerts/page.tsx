"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminAlertLogItem } from "@ihiga-lite/shared";
import { listAdminAlerts } from "../../../../lib/admin-alerts-api";
import { MaskedPhoneNumber } from "../../../../components/admin/farmers/MaskedPhoneNumber";

const PAGE_SIZE = 20;

function triggerReasonLabel(alert: AdminAlertLogItem): string {
  if (alert.stageChanged && alert.weatherRisk) {
    return "Stage change + weather risk";
  }
  if (alert.stageChanged) {
    return "Stage change";
  }
  if (alert.weatherRisk) {
    return "Weather risk";
  }
  return "—";
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function OutcomeBadge({ alert }: { alert: AdminAlertLogItem }) {
  if (alert.outcome === "sent") {
    return <span className="rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-sage-dark">Sent to provider</span>;
  }
  if (alert.outcome === "not_configured") {
    return <span className="rounded-full bg-parchment-3 px-2.5 py-1 text-xs font-medium text-ink-soft">Not configured</span>;
  }
  return <span className="rounded-full bg-clay/15 px-2.5 py-1 text-xs font-medium text-clay">Failed</span>;
}

export default function AdminAlertsPage() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AdminAlertLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAdminAlerts({ page, pageSize: PAGE_SIZE });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Alerts log</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Every SMS alert the daily job has actually triggered — a crop-stage change or a weather risk — with the real
          delivery status Africa&apos;s Talking reported.
        </p>
      </div>

      <div className="rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">
        <strong className="font-semibold">Sandbox only, currently.</strong> This app is configured with Africa&apos;s
        Talking <em>sandbox</em> credentials. &quot;Sent to provider&quot; below (with a real cost line item in RWF)
        confirms the integration itself works — it does <strong>not</strong> confirm a real Rwandan farmer&apos;s phone
        received anything. The sandbox only reliably delivers to Airtel Kenya test numbers. Going live needs an
        approved Africa&apos;s Talking Sender ID, which requires a registered business — see DEPLOYMENT.md.
      </div>

      {error && <p className="text-sm text-clay">{error}</p>}

      {/* Mobile: one card per alert. */}
      <div className="flex flex-col gap-3 md:hidden">
        {isLoading && <p className="py-6 text-center text-sm text-ink-faint">Loading…</p>}
        {!isLoading && items.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-faint">No alerts have been triggered yet.</p>
        )}
        {!isLoading &&
          items.map((alert) => (
            <div key={alert.id} className="rounded-2xl border border-soil/10 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <MaskedPhoneNumber phoneNumber={alert.farmerPhoneNumber} />
                <OutcomeBadge alert={alert} />
              </div>
              <div className="mt-1.5 text-xs text-ink-faint">
                {triggerReasonLabel(alert)} · {formatDateTime(alert.createdAt)}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{alert.message}</p>
              <div className="mt-2 border-t border-soil/5 pt-2 text-xs text-ink-soft">
                {alert.outcome === "sent" ? (
                  <span>
                    Provider: {alert.providerStatus}
                    {alert.providerCost ? ` · ${alert.providerCost}` : ""}
                  </span>
                ) : alert.outcome === "failed" ? (
                  <span className="text-clay">{alert.errorMessage ?? "Send failed"}</span>
                ) : (
                  <span className="text-ink-faint">Africa&apos;s Talking not configured</span>
                )}
              </div>
            </div>
          ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-soil/10 bg-white md:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-soil/10 text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3 font-medium">Farmer</th>
              <th className="px-4 py-3 font-medium">Trigger</th>
              <th className="px-4 py-3 font-medium">Message</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Provider response</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-faint">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-faint">
                  No alerts have been triggered yet.
                </td>
              </tr>
            )}
            {!isLoading &&
              items.map((alert) => (
                <tr key={alert.id} className="border-b border-soil/5 align-top last:border-0">
                  <td className="px-4 py-3">
                    <MaskedPhoneNumber phoneNumber={alert.farmerPhoneNumber} />
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{triggerReasonLabel(alert)}</td>
                  <td className="max-w-sm px-4 py-3 text-ink-soft">
                    <span className="line-clamp-2" title={alert.message}>
                      {alert.message}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <OutcomeBadge alert={alert} />
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {alert.outcome === "sent" ? (
                      <span>
                        {alert.providerStatus}
                        {alert.providerCost ? ` · ${alert.providerCost}` : ""}
                      </span>
                    ) : alert.outcome === "failed" ? (
                      <span className="text-clay" title={alert.errorMessage ?? undefined}>
                        {alert.errorMessage ?? "Send failed"}
                      </span>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDateTime(alert.createdAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!isLoading && total > 0 && (
        <div className="flex flex-col gap-3 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <span>
            {total} alert{total === 1 ? "" : "s"} · page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-soil/15 px-3 py-1.5 font-medium text-ink-soft disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-soil/15 px-3 py-1.5 font-medium text-ink-soft disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { AdminFarmerListItem } from "@ihiga-lite/shared";
import { listAdminFarmers } from "../../../../lib/admin-farmers-api";
import { MaskedPhoneNumber } from "../../../../components/admin/farmers/MaskedPhoneNumber";

const PAGE_SIZE = 20;

const LANGUAGE_LABELS: Record<string, string> = { en: "English", rw: "Kinyarwanda", fr: "French" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminFarmersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AdminFarmerListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAdminFarmers({ search: search || undefined, page, pageSize: PAGE_SIZE });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load farmers");
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Farmers</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Registered farmers — read-only. Phone numbers are masked by default; click one to reveal it.
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by phone number or region…"
          className="w-full rounded-xl border border-soil/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-sage sm:w-80"
        />
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-xl border border-soil/15 bg-white px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-parchment-3"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setPage(1);
              }}
              className="rounded-xl px-4 py-2 text-sm font-medium text-ink-faint hover:text-ink-soft"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {error && <p className="text-sm text-clay">{error}</p>}

      {/* Mobile: one card per farmer. */}
      <div className="flex flex-col gap-3 md:hidden">
        {isLoading && <p className="py-6 text-center text-sm text-ink-faint">Loading…</p>}
        {!isLoading && items.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-faint">No farmers match this search.</p>
        )}
        {!isLoading &&
          items.map((farmer) => (
            // Deliberately not a whole-card <Link> — MaskedPhoneNumber renders
            // its own <button> (invalid to nest inside an <a>, and it'd fight
            // the card for the click), so navigation is an explicit "View" link instead.
            <div key={farmer.id} className="rounded-2xl border border-soil/10 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <MaskedPhoneNumber phoneNumber={farmer.phoneNumber} />
                {farmer.deactivatedAt ? (
                  <span className="shrink-0 rounded-full bg-clay/15 px-2.5 py-1 text-xs font-medium text-clay">Deactivated</span>
                ) : (
                  <span className="shrink-0 rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-sage-dark">Active</span>
                )}
              </div>
              <div className="mt-2 text-xs text-ink-faint">
                {farmer.district ?? "No region"}
                {farmer.preferredLanguage && ` · ${LANGUAGE_LABELS[farmer.preferredLanguage] ?? farmer.preferredLanguage}`}
                {farmer.trackedCropName && ` · ${farmer.trackedCropName}`}
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-soil/5 pt-2">
                <span className="text-xs text-ink-faint">Registered {formatDate(farmer.createdAt)}</span>
                <Link href={`/admin/farmers/${farmer.id}`} className="text-sm font-medium text-sage-dark hover:opacity-80">
                  View
                </Link>
              </div>
            </div>
          ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-soil/10 bg-white md:block">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-soil/10 text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Region</th>
              <th className="px-4 py-3 font-medium">Language</th>
              <th className="px-4 py-3 font-medium">Tracked crop</th>
              <th className="px-4 py-3 font-medium">Registered</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-faint">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-faint">
                  No farmers match this search.
                </td>
              </tr>
            )}
            {!isLoading &&
              items.map((farmer) => (
                <tr key={farmer.id} className="border-b border-soil/5 last:border-0 hover:bg-parchment/40">
                  <td className="px-4 py-3">
                    <MaskedPhoneNumber phoneNumber={farmer.phoneNumber} />
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{farmer.district ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {farmer.preferredLanguage ? LANGUAGE_LABELS[farmer.preferredLanguage] ?? farmer.preferredLanguage : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{farmer.trackedCropName ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{formatDate(farmer.createdAt)}</td>
                  <td className="px-4 py-3">
                    {farmer.deactivatedAt ? (
                      <span className="rounded-full bg-clay/15 px-2.5 py-1 text-xs font-medium text-clay">Deactivated</span>
                    ) : (
                      <span className="rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-sage-dark">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/farmers/${farmer.id}`} className="text-sm font-medium text-sage-dark hover:opacity-80">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!isLoading && total > 0 && (
        <div className="flex flex-col gap-3 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <span>
            {total} farmer{total === 1 ? "" : "s"} · page {page} of {totalPages}
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

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminLogout } from "../../lib/admin-api";

/**
 * Grows by one entry per phase as real admin pages land (knowledge base,
 * crops/seasons, farmers, conversations, alerts, regions) — deliberately just
 * "Dashboard" for now so this never links to a route that doesn't exist yet.
 */
const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/knowledge", label: "Knowledge Base" },
  { href: "/admin/crops", label: "Crops & Stages" },
  { href: "/admin/seasons", label: "Seasons" },
  { href: "/admin/farmers", label: "Farmers" },
  { href: "/admin/alerts", label: "Alerts Log" },
  { href: "/admin/regions", label: "Regions" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await adminLogout();
    router.replace("/admin/login");
  }

  return (
    <div className="flex min-h-dvh bg-parchment-2">
      <aside className="flex w-60 shrink-0 flex-col justify-between bg-soil-deep px-4 py-6 text-parchment">
        <div>
          <div className="mb-8 px-2 text-base font-semibold">Ihiga Lite Admin</div>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              // Exact match for the dashboard root (else it'd stay highlighted
              // under every other section, since "/admin" prefixes them all);
              // prefix match everywhere else so a sub-route like
              // /admin/farmers/[id] still highlights its parent "Farmers" tab.
              const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-sage text-white" : "text-parchment/80 hover:bg-white/10 hover:text-parchment"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg px-3 py-2 text-left text-sm font-medium text-parchment/70 transition-colors hover:bg-white/10 hover:text-parchment"
        >
          Sign out
        </button>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-auto p-8">{children}</main>
    </div>
  );
}

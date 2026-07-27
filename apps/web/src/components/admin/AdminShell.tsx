"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
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

function isNavItemActive(pathname: string, href: string): boolean {
  // Exact match for the dashboard root (else it'd stay highlighted under
  // every other section, since "/admin" prefixes them all); prefix match
  // everywhere else so a sub-route like /admin/farmers/[id] still
  // highlights its parent "Farmers" tab.
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/** Shared between the permanent desktop sidebar and the mobile slide-in drawer, so the two can never drift out of sync. */
function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = isNavItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:py-2 ${
              isActive ? "bg-sage text-white" : "text-parchment/80 hover:bg-white/10 hover:text-parchment"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // A route change (tapping a nav link) should always close the drawer —
  // without this it'd stay open, covering the page that just loaded.
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Escape closes the drawer, same convention as ChatActionsMenu/ConfirmDialog.
  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen]);

  async function handleLogout() {
    await adminLogout();
    router.replace("/admin/login");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-parchment-2 md:flex-row">
      {/* Mobile top bar — sticky so the menu button is always reachable, even
          scrolled deep into a long table. Hidden entirely at md+, where the
          permanent sidebar below takes over instead. */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-soil-deep px-4 py-3 text-parchment shadow-sm md:hidden">
        <span className="text-base font-semibold">Ihiga Lite Admin</span>
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Open menu"
          aria-expanded={isDrawerOpen}
          className="flex h-9 w-9 items-center justify-center rounded-full text-parchment/90 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
        >
          <MenuIcon />
        </button>
      </header>

      {/* Mobile slide-in drawer + backdrop. */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-soil-deep/60 backdrop-blur-[1px] md:hidden"
              aria-hidden="true"
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col justify-between bg-soil-deep px-4 py-6 text-parchment shadow-2xl md:hidden"
            >
              <div>
                <div className="mb-8 flex items-center justify-between px-2">
                  <span className="text-base font-semibold">Ihiga Lite Admin</span>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    aria-label="Close menu"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-parchment/80 transition-colors hover:bg-white/10"
                  >
                    <CloseIcon />
                  </button>
                </div>
                <NavLinks pathname={pathname} onNavigate={() => setIsDrawerOpen(false)} />
              </div>

              <button
                onClick={handleLogout}
                className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-parchment/70 transition-colors hover:bg-white/10 hover:text-parchment"
              >
                Sign out
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop permanent sidebar — unchanged from before, just scoped to md+. */}
      <aside className="hidden shrink-0 flex-col justify-between bg-soil-deep px-4 py-6 text-parchment md:flex md:w-60">
        <div>
          <div className="mb-8 px-2 text-base font-semibold">Ihiga Lite Admin</div>
          <NavLinks pathname={pathname} />
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg px-3 py-2 text-left text-sm font-medium text-parchment/70 transition-colors hover:bg-white/10 hover:text-parchment"
        >
          Sign out
        </button>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-auto p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  );
}

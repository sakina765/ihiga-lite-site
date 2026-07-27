"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { IntroSplash } from "./IntroSplash";

/**
 * Shows the intro splash on every load (no localStorage persistence — it's
 * meant to play every time the app opens, not just on a visitor's first
 * visit). Children mount immediately underneath, hidden behind the splash's
 * opaque overlay, so there's no extra loading wait once it finishes.
 *
 * Skipped entirely under /admin — this is app/layout.tsx's root layout, so
 * it wraps the admin panel too (Next.js only supports one root layout
 * without splitting the whole route tree into groups, which is a much
 * bigger structural change than this admin-only opt-out needs). A farmer-
 * facing marketing splash has no place in an internal admin tool, and
 * (verified live) it was literally covering the admin UI on every load.
 */
export function IntroGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showSplash, setShowSplash] = useState(true);

  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {showSplash && <IntroSplash onComplete={() => setShowSplash(false)} />}
    </>
  );
}

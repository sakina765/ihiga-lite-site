"use client";

import { useState } from "react";
import { IntroSplash } from "./IntroSplash";

/**
 * Shows the intro splash on every load (no localStorage persistence — it's
 * meant to play every time the app opens, not just on a visitor's first
 * visit). Children mount immediately underneath, hidden behind the splash's
 * opaque overlay, so there's no extra loading wait once it finishes.
 */
export function IntroGate({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {children}
      {showSplash && <IntroSplash onComplete={() => setShowSplash(false)} />}
    </>
  );
}

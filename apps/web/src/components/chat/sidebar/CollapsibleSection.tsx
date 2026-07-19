"use client";

import { useEffect, useState } from "react";

function readStoredOpen(storageKey: string | undefined, defaultOpen: boolean): boolean {
  if (!storageKey || typeof window === "undefined") {
    return defaultOpen;
  }
  const stored = window.localStorage.getItem(storageKey);
  return stored === null ? defaultOpen : stored === "true";
}

export function CollapsibleSection({
  title,
  defaultOpen = true,
  /** Persists open/closed state across a reload, keyed per section (e.g. "ihiga_sidebar_weather_open"). Omit for a section with no persisted state. */
  storageKey,
  /** true = show a risk indicator on the header, even while collapsed — reserved for the farmer's own current weather status. */
  risk = false,
  /** Optional decorative emoji shown next to the collapse chevron — purely visual, never the only way to identify the section (title text is always present). */
  headerIcon,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  storageKey?: string;
  risk?: boolean;
  headerIcon?: string;
  children: React.ReactNode;
}) {
  // Lazy initializer, not an effect — this component only ever mounts after
  // the app is already client-side past hydration (ChatGate gates the whole
  // chat UI behind a client-only localStorage check first), so there's no
  // SSR/hydration mismatch risk in reading localStorage here directly.
  const [open, setOpen] = useState(() => readStoredOpen(storageKey, defaultOpen));

  useEffect(() => {
    if (storageKey) {
      window.localStorage.setItem(storageKey, String(open));
    }
  }, [open, storageKey]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/50 shadow-sm backdrop-blur-md">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold ${risk ? "text-clay" : "text-ink"}`}
      >
        <span className="flex items-center gap-1.5">
          {risk && <span aria-hidden="true" className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />}
          {title}
          {risk && <span className="sr-only">— weather risk today</span>}
        </span>
        <span className="flex items-center gap-1.5">
          {headerIcon && (
            <span aria-hidden="true" className="text-base leading-none">
              {headerIcon}
            </span>
          )}
          <span aria-hidden="true" className={`text-ink-faint transition-transform ${open ? "rotate-180" : ""}`}>
            ▾
          </span>
        </span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

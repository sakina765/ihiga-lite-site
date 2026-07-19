/** Small rounded status badge — "good" (sage) / "risk" (clay), the same tone pairing used everywhere else soil-workability shows up in this sidebar. */
export function StatusPill({ tone, children }: { tone: "good" | "risk"; children: React.ReactNode }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${
        tone === "good" ? "bg-sage/15 text-sage-dark" : "bg-clay/15 text-clay"
      }`}
    >
      {children}
    </span>
  );
}

/** Icon + calm "+ Add X" prompt — the shared empty-state treatment for sidebar cards with nothing to show yet. */
export function EmptyStatePrompt({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/50 bg-white/40 px-4 py-6 text-center shadow-sm backdrop-blur-md">
      <span aria-hidden="true" className="text-2xl leading-none">
        {icon}
      </span>
      <p className="text-xs text-ink-faint">{label}</p>
    </div>
  );
}

export function RecordingIndicator({ elapsedMs, onStop }: { elapsedMs: number; onStop: () => void }) {
  const seconds = Math.floor(elapsedMs / 1000);

  return (
    <div className="border-t border-parchment-2 bg-white px-3 py-2">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop recording"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-dark"
        >
          ⏹
        </button>
        <span className="flex items-center gap-2 text-sm text-ink" role="status">
          <span
            className="h-2.5 w-2.5 rounded-full bg-clay motion-safe:animate-pulse motion-reduce:animate-none"
            aria-hidden="true"
          />
          Recording… {seconds}s
        </span>
      </div>
    </div>
  );
}

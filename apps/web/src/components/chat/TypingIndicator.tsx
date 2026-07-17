export function TypingIndicator({ label }: { label?: string }) {
  return (
    <div className="flex items-start" aria-hidden="true">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-parchment-2 bg-white px-3 py-2.5">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint motion-reduce:animate-none [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint motion-reduce:animate-none [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint motion-reduce:animate-none" />
        </span>
        {label && <span className="text-xs text-ink-faint">{label}</span>}
      </div>
    </div>
  );
}

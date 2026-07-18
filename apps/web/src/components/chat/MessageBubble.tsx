import type { DisplayMessage } from "./types";

function formatTimestamp(ts: number): string {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(ts));
}

export function MessageBubble({ message, onRetry }: { message: DisplayMessage; onRetry?: () => void }) {
  if (message.role === "error") {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-clay/40 bg-parchment px-3 py-2 text-sm text-ink">
          {message.text}
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-parchment-3 px-3 py-1 text-xs font-medium text-sage-dark hover:bg-parchment-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-dark"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  const isUser = message.role === "user";

  // User bubbles use sage-dark rather than the base sage swatch: parchment text on
  // sage is ~3.2:1 contrast (fails WCAG AA's 4.5:1 for body text), while parchment
  // on sage-dark is ~6.4:1.
  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[85%] break-words rounded-2xl rounded-br-sm bg-sage-dark px-3 py-2 text-sm text-parchment"
            : "max-w-[85%] break-words rounded-2xl rounded-bl-sm border border-parchment-2 bg-white px-3 py-2 text-sm text-ink"
        }
      >
        {message.inputType === "photo" && message.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob: preview, not a static/remote asset
          <img src={message.imageUrl} alt="Photo shared with Ihiga" className="mb-1 max-h-48 w-full rounded-xl object-cover" />
        )}
        {message.inputType === "voice" && (
          <span className="mr-1" aria-hidden="true">
            🎙️
          </span>
        )}
        {message.text}
      </div>
      {/* ink-soft, not ink-faint: this timestamp sits directly on the parchment
          background (not inside an opaque bubble), and ink-faint only reaches
          ~3.3:1 contrast there — already short of WCAG AA's 4.5:1 floor before
          the background pattern is even added. ink-soft holds ~5.3:1 (and
          still ~4.9:1 worst-case against the pattern at its darkest overlap). */}
      {isUser && <span className="mt-1 text-[11px] text-ink-soft">{formatTimestamp(message.timestamp)}</span>}
    </div>
  );
}

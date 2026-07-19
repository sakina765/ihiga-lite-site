import type { DisplayMessage } from "./types";
import { useLanguage } from "../../i18n/LanguageProvider";

function formatTimestamp(ts: number): string {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(ts));
}

export function MessageBubble({ message, onRetry }: { message: DisplayMessage; onRetry?: () => void }) {
  const { t } = useLanguage();

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
            {t("chat.messageBubble.retry")}
          </button>
        )}
      </div>
    );
  }

  const isUser = message.role === "user";

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
          <img src={message.imageUrl} alt={t("chat.messageBubble.photoAlt")} className="mb-1 max-h-48 w-full rounded-xl object-cover" />
        )}
        {message.inputType === "voice" && (
          <span className="mr-1" aria-hidden="true">
            🎙️
          </span>
        )}
        {message.text}
      </div>
      {isUser && <span className="mt-1 text-[11px] text-ink-soft">{formatTimestamp(message.timestamp)}</span>}
    </div>
  );
}

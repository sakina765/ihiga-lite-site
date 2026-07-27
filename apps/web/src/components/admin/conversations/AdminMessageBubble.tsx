"use client";

import { useState } from "react";
import type { AdminMessageDetail } from "@ihiga-lite/shared";

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path d="M12 3.5l2.6 5.6 6 0.7-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6-4.4-4.2 6-0.7z" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Mirrors the farmer-facing MessageBubble's exact visual language (same
 * bg/border/rounding classes as apps/web/src/components/chat/MessageBubble.tsx)
 * so an admin sees the thread exactly as the farmer did — plus admin-only
 * controls (grounding disclosure, flag toggle) neither farmer UI nor its
 * component has any reason to carry.
 */
export function AdminMessageBubble({
  message,
  onToggleFlag,
  isTogglingFlag,
}: {
  message: AdminMessageDetail;
  onToggleFlag: (message: AdminMessageDetail) => void;
  isTogglingFlag: boolean;
}) {
  const [factsOpen, setFactsOpen] = useState(false);
  const isUser = message.role === "user";

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
        <div
          className={
            isUser
              ? "max-w-[85%] sm:max-w-[70%] break-words rounded-2xl rounded-br-sm bg-sage-dark px-3 py-2 text-sm text-parchment"
              : "max-w-[85%] sm:max-w-[70%] break-words rounded-2xl rounded-bl-sm border border-parchment-2 bg-white px-3 py-2 text-sm text-ink"
          }
        >
          {message.type === "voice" && (
            <span className="mr-1" aria-hidden="true">
              🎙️
            </span>
          )}
          {message.type === "photo" && (
            <span className="mr-1" aria-hidden="true">
              📷
            </span>
          )}
          {message.text}
        </div>

        {!isUser && (
          <button
            type="button"
            onClick={() => onToggleFlag(message)}
            disabled={isTogglingFlag}
            title={message.flagged ? "Unflag this reply" : "Flag this reply to revisit later"}
            className={`shrink-0 rounded-full p-1.5 transition-colors disabled:opacity-50 ${
              message.flagged ? "text-sage-dark" : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            <StarIcon filled={message.flagged} />
          </button>
        )}
      </div>

      <span className="mt-1 text-[11px] text-ink-soft">{formatTime(message.createdAt)}</span>

      {!isUser && (
        <div className="mt-1 max-w-[85%] sm:max-w-[70%]">
          {message.retrievedFacts === null ? (
            <span className="text-[11px] italic text-ink-faint">Grounding not recorded for this reply</span>
          ) : message.retrievedFacts.length === 0 ? (
            <span className="text-[11px] italic text-ink-faint">No knowledge facts retrieved for this reply</span>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setFactsOpen((prev) => !prev)}
                className="text-[11px] font-medium text-sage-dark underline decoration-dotted underline-offset-2"
              >
                {factsOpen ? "Hide" : "Show"} {message.retrievedFacts.length} fact{message.retrievedFacts.length === 1 ? "" : "s"}{" "}
                available for this reply
              </button>
              {factsOpen && (
                <ul className="mt-1 flex flex-col gap-1 rounded-lg border border-soil/10 bg-parchment/60 p-2">
                  {message.retrievedFacts.map((fact) => (
                    <li key={fact.id} className="text-[11px] text-ink-soft">
                      <span className="font-medium text-ink">[{fact.topic}]</span> {fact.factText}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

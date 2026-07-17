"use client";

import { useEffect, useRef } from "react";
import type { DisplayMessage } from "./types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

export function MessageList({
  messages,
  isLoading,
  loadingLabel,
  loadingSrLabel,
  onRetry,
}: {
  messages: DisplayMessage[];
  isLoading: boolean;
  /** Visible text next to the typing dots — undefined means "just show dots". */
  loadingLabel?: string;
  /** Always-present text for screen readers, even when loadingLabel is undefined. */
  loadingSrLabel: string;
  onRetry: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // No `behavior: "smooth"` — instant scroll is both simpler and inherently
    // respects prefers-reduced-motion (there's no animation to reduce).
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, isLoading]);

  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      className="flex-1 space-y-3 overflow-y-auto bg-parchment px-4 py-4"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} onRetry={message.role === "error" ? onRetry : undefined} />
      ))}
      {isLoading && (
        <>
          <TypingIndicator label={loadingLabel} />
          <span className="sr-only" role="status">
            {loadingSrLabel}
          </span>
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

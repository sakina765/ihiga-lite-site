"use client";

import { useEffect, useRef } from "react";
import type { DisplayMessage } from "./types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ChatBackgroundPattern } from "../ChatBackgroundPattern";

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
    // relative + overflow-hidden here (not on the scrolling div itself) so
    // ChatBackgroundPattern is a sibling layer that fills this box and stays
    // put — an absolutely-positioned child of the SCROLLING div would scroll
    // away with the content, since its position is relative to the content's
    // own coordinate space, not the visible viewport.
    <div className="relative flex-1 overflow-hidden bg-parchment">
      <ChatBackgroundPattern />
      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="absolute inset-0 overflow-y-auto px-4 py-4"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col space-y-3">
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
      </div>
    </div>
  );
}

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
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, isLoading]);

  return (
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

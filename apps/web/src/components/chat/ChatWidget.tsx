"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SeasonInfo } from "@ihiga-lite/shared";
import { sendChatMessage, sendPhotoMessage, sendVoiceMessage } from "../../lib/chat-api";
import { ChatHeader } from "./ChatHeader";
import { SeasonStrip } from "./SeasonStrip";
import { MessageList } from "./MessageList";
import { ChipRow } from "./ChipRow";
import { InputBar } from "./InputBar";
import { ChatSidebar } from "./sidebar/ChatSidebar";
import type { DisplayMessage } from "./types";
import { useLanguage } from "../../i18n/LanguageProvider";

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type LoadingKind = "text" | "voice" | "photo" | null;

function getLoadingCopy(
  t: (key: string) => string,
  kind: LoadingKind,
  isSlow: boolean,
): { label?: string; srLabel: string } {
  if (kind === "voice") {
    return isSlow
      ? { label: t("chat.widget.loading.voiceSlow"), srLabel: t("chat.widget.loading.voiceSlowSr") }
      : { label: t("chat.widget.loading.voiceFast"), srLabel: t("chat.widget.loading.voiceFastSr") };
  }
  if (kind === "photo") {
    return isSlow
      ? { label: t("chat.widget.loading.photoSlow"), srLabel: t("chat.widget.loading.photoSlowSr") }
      : { label: t("chat.widget.loading.photoFast"), srLabel: t("chat.widget.loading.photoFastSr") };
  }
  return isSlow
    ? { label: t("chat.widget.loading.textSlow"), srLabel: t("chat.widget.loading.textSlowSr") }
    : { label: undefined, srLabel: t("chat.widget.loading.textFastSr") };
}

export function ChatWidget({ farmerId }: { farmerId: string }) {
  // conversationId is created lazily by the API on the FIRST real message — we never
  // call the API on mount just to obtain one. If we did, every visitor who opens the
  // page and never sends a message would leave behind an orphaned Conversation row
  // with zero Messages. Staying undefined until submitMessage() fires means a
  // Conversation only ever gets created once there's an actual message to attach it to.
  const conversationIdRef = useRef<string | undefined>(undefined);
  // Replays whichever submission last failed — set in each submit*'s catch block,
  // cleared on success. Generalizes retry across text/voice/photo without needing
  // to remember which flavor of message failed.
  const lastFailedActionRef = useRef<(() => void) | null>(null);
  const { t } = useLanguage();

  const [messages, setMessages] = useState<DisplayMessage[]>(() => [
    { id: "welcome", role: "bot", text: t("chat.widget.welcome"), timestamp: 0 },
  ]);
  const [season, setSeason] = useState<SeasonInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingKind, setLoadingKind] = useState<LoadingKind>(null);
  const [isSlow, setIsSlow] = useState(false);
  // Bumped after every successful chat response (text/voice/photo) so the
  // sidebar's "Your crop"/"Today's summary" cards refetch and reflect a crop
  // the chat confirm flow just wrote — without this, confirming "Yes, track
  // maize..." would leave the sidebar showing its stale empty state until a
  // full page reload.
  const [cropRefreshSignal, setCropRefreshSignal] = useState(0);

  // With Groq this threshold rarely fires for text in practice — real calls measured
  // consistently under ~1s (vs. Gemini, which ranged from ~2s up to ~98s under heavy
  // load before the migration). Kept as a safety net rather than removed: a bare
  // bouncing-dots indicator still reads as "frozen" on a slow connection or provider
  // hiccup, and this costs nothing when replies are fast. Voice/photo get their own
  // immediate descriptive label regardless (see getLoadingCopy) since those always
  // involve a distinct extra step worth naming.
  useEffect(() => {
    if (!isLoading) {
      setIsSlow(false);
      return;
    }
    const timer = setTimeout(() => setIsSlow(true), 6000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const lastMessage = messages[messages.length - 1];
  const latestChips = !isLoading && lastMessage?.role === "bot" ? (lastMessage.chips ?? []) : [];
  const { label: loadingLabel, srLabel: loadingSrLabel } = getLoadingCopy(t, loadingKind, isSlow);

  const submitMessage = useCallback(async (text: string) => {
    setLoadingKind("text");
    setMessages((prev) => [...prev, { id: makeId(), role: "user", text, timestamp: Date.now() }]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage({ conversationId: conversationIdRef.current, farmerId, message: text });

      conversationIdRef.current = response.conversationId;
      setSeason(response.season);
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "bot", text: response.replyText, chips: response.suggestedChips, timestamp: Date.now() },
      ]);
      lastFailedActionRef.current = null;
      setCropRefreshSignal((n) => n + 1);
    } catch {
      lastFailedActionRef.current = () => submitMessage(text);
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "error", text: t("chat.widget.error.generic"), timestamp: Date.now() },
      ]);
    } finally {
      setIsLoading(false);
      setLoadingKind(null);
    }
  }, [farmerId, t]);

  const submitVoiceMessage = useCallback(async (audioBlob: Blob) => {
    setLoadingKind("voice");
    setIsLoading(true);

    try {
      const response = await sendVoiceMessage({ conversationId: conversationIdRef.current, farmerId, audioBlob });

      conversationIdRef.current = response.conversationId;
      setSeason(response.season);
      // The user bubble only appears once we know what Whisper actually heard —
      // never optimistically, since we have no confirmed text before this point.
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "user", text: response.transcribedText, inputType: "voice", timestamp: Date.now() },
        { id: makeId(), role: "bot", text: response.replyText, chips: response.suggestedChips, timestamp: Date.now() },
      ]);
      lastFailedActionRef.current = null;
      setCropRefreshSignal((n) => n + 1);
    } catch {
      lastFailedActionRef.current = () => submitVoiceMessage(audioBlob);
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "error", text: t("chat.widget.error.voice"), timestamp: Date.now() },
      ]);
    } finally {
      setIsLoading(false);
      setLoadingKind(null);
    }
  }, [farmerId, t]);

  const submitPhotoMessage = useCallback(async (imageFile: File) => {
    setLoadingKind("photo");
    setIsLoading(true);
    const imageUrl = URL.createObjectURL(imageFile);

    try {
      const response = await sendPhotoMessage({ conversationId: conversationIdRef.current, farmerId, imageFile });

      conversationIdRef.current = response.conversationId;
      setSeason(response.season);
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "user", text: "", inputType: "photo", imageUrl, timestamp: Date.now() },
        { id: makeId(), role: "bot", text: response.replyText, chips: response.suggestedChips, timestamp: Date.now() },
      ]);
      lastFailedActionRef.current = null;
      setCropRefreshSignal((n) => n + 1);
    } catch {
      URL.revokeObjectURL(imageUrl);
      lastFailedActionRef.current = () => submitPhotoMessage(imageFile);
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "error", text: t("chat.widget.error.photo"), timestamp: Date.now() },
      ]);
    } finally {
      setIsLoading(false);
      setLoadingKind(null);
    }
  }, [farmerId, t]);

  const handleRetry = useCallback(() => {
    const retry = lastFailedActionRef.current;
    if (!retry) {
      return;
    }
    // Drop the trailing error bubble so it doesn't linger alongside the retried turn.
    setMessages((prev) => (prev[prev.length - 1]?.role === "error" ? prev.slice(0, -1) : prev));
    retry();
  }, []);

  return (
    // Genuinely full-width/full-height on desktop, like WhatsApp Web/Slack/
    // ChatGPT — not a centered card with empty page showing on both sides.
    // Each bar below (header, season strip, message list, input) spans the
    // full width itself; only the CONTENT inside each is centered to a
    // comfortable max-width, so text/controls don't stretch uncomfortably
    // wide on an ultrawide monitor while the screen still reads as fully used.
    <div className="flex h-dvh flex-col bg-parchment">
      <ChatHeader />
      <SeasonStrip season={season} />
      {/* The sidebar lives INSIDE the chat body, below the header/season
          strip — not as a page-level sibling spanning the full viewport
          height, which would make it read as a separate overlay rather than
          part of this chat screen. min-h-0 (not just flex-1) is required on
          both nested flex columns below: MessageList gets its internal
          scroll from `flex-1 overflow-hidden` + an absolutely-positioned
          `overflow-y-auto` child, which only works if its flex ancestor
          chain has a properly bounded height — omit min-h-0 and the chat
          pane grows past the viewport instead of scrolling internally. */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <ChatSidebar farmerId={farmerId} cropRefreshSignal={cropRefreshSignal} />
        <div className="flex min-h-0 flex-1 flex-col">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            loadingLabel={loadingLabel}
            loadingSrLabel={loadingSrLabel}
            onRetry={handleRetry}
          />
          <ChipRow chips={latestChips} onSelect={submitMessage} disabled={isLoading} />
          <InputBar
            onSend={submitMessage}
            onVoiceMessage={submitVoiceMessage}
            onPhotoMessage={submitPhotoMessage}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

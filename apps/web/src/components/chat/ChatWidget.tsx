"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ConversationMessage, SeasonInfo } from "@ihiga-lite/shared";
import { deleteConversation, getConversation, sendChatMessage, sendPhotoMessage, sendVoiceMessage } from "../../lib/chat-api";
import { buildChatTranscriptPdf, type ChatPdfMessage } from "../../lib/chat-pdf";
import { shareChatPdfViaWhatsApp } from "../../lib/chat-share";
import { ChatHeader } from "./ChatHeader";
import { SeasonStrip } from "./SeasonStrip";
import { MessageList } from "./MessageList";
import { ChipRow } from "./ChipRow";
import { InputBar } from "./InputBar";
import { ChatSidebar } from "./sidebar/ChatSidebar";
import { DeleteConversationDialog } from "./DeleteConversationDialog";
import { ChatToast } from "./ChatToast";
import { SEASON_DESCRIPTOR_KEY, formatMonthRange } from "./SeasonStrip";
import type { DisplayMessage } from "./types";
import { useLanguage } from "../../i18n/LanguageProvider";

const CONVERSATION_STORAGE_KEY = "ihiga_conversation_id";

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Bot messages are always persisted as type "text" — only a user-sent voice/photo needs the icon treatment. */
function toDisplayMessage(message: ConversationMessage): DisplayMessage {
  return {
    id: makeId(),
    role: message.role,
    text: message.text,
    timestamp: new Date(message.createdAt).getTime(),
    inputType: message.role === "user" && message.type !== "text" ? message.type : undefined,
  };
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // On mount, resume whatever conversation was last active for this farmer
  // (survives a refresh, or navigating to / and back to /chat) — without
  // this, conversationIdRef only ever lived in memory and a fresh page load
  // always looked like a brand-new conversation even though the backend
  // still had the full message history sitting in the database.
  useEffect(() => {
    const storedConversationId = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (!storedConversationId) {
      return;
    }

    let cancelled = false;
    getConversation(storedConversationId, farmerId)
      .then((history) => {
        if (cancelled) {
          return;
        }
        conversationIdRef.current = history.conversationId;
        setSeason(history.season);
        if (history.messages.length > 0) {
          setMessages(history.messages.map(toDisplayMessage));
        }
      })
      .catch(() => {
        // Stale/unknown conversationId (or it belongs to a different
        // farmerId) — fall back to a fresh conversation rather than getting
        // stuck unable to send anything.
        if (!cancelled) {
          localStorage.removeItem(CONVERSATION_STORAGE_KEY);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only ever resume once, on mount, for this farmerId
  }, []);

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
      localStorage.setItem(CONVERSATION_STORAGE_KEY, response.conversationId);
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
      localStorage.setItem(CONVERSATION_STORAGE_KEY, response.conversationId);
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
      localStorage.setItem(CONVERSATION_STORAGE_KEY, response.conversationId);
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

  // Nothing to delete or share until the farmer has actually said something —
  // the lone "welcome" placeholder isn't a real exchange.
  const hasConversation = useMemo(() => messages.some((m) => m.id !== "welcome"), [messages]);

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      if (conversationIdRef.current) {
        await deleteConversation(conversationIdRef.current, farmerId);
      }
      // conversationIdRef and the stored id are deliberately left alone — the
      // Conversation row (and the cropId/plantingDate/language it carries)
      // still exists server-side, only its messages were cleared. Reusing
      // the same id for whatever the farmer sends next keeps that crop
      // tracking intact instead of falling back to the previously-tracked
      // lookup in loadOrCreateConversation.
      setMessages([{ id: "welcome", role: "bot", text: t("chat.widget.welcome"), timestamp: 0 }]);
      setSeason(null);
      setIsDeleteDialogOpen(false);
    } catch {
      setToastMessage(t("chat.deleteDialog.error"));
    } finally {
      setIsDeleting(false);
    }
  }, [farmerId, t]);

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    try {
      const pdfMessages: ChatPdfMessage[] = messages
        .filter((message) => message.role !== "error")
        .map((message) => ({
          role: message.role as "user" | "bot",
          text: message.text,
          timestamp: message.timestamp,
          inputType: message.inputType,
        }));

      const subtitle = season
        ? `${t("chat.season.label", {
            code: season.code,
            localName: season.localName,
            range: formatMonthRange(season.startDate, season.endDate),
            descriptor: t(SEASON_DESCRIPTOR_KEY[season.code]),
          })}`
        : undefined;

      const doc = buildChatTranscriptPdf(pdfMessages, {
        docTitle: t("chat.share.pdfTitle"),
        subtitle,
        generatedOnLabel: t("chat.share.generatedOn", {
          date: new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
        }),
        youLabel: t("chat.share.you"),
        botLabel: t("chat.share.bot"),
        photoPlaceholder: t("chat.messageBubble.photoAlt"),
        photoTag: t("chat.share.photoTag"),
        voiceTag: t("chat.share.voiceTag"),
        footerBrand: t("chat.share.footerBrand"),
        pageLabelTemplate: t("chat.share.pageLabel"),
      });

      const outcome = await shareChatPdfViaWhatsApp(doc, {
        filename: "ihiga-lite-chat.pdf",
        shareTitle: t("chat.share.pdfTitle"),
        shareText: t("chat.share.whatsappMessage"),
        whatsappFallbackText: t("chat.share.whatsappMessage"),
      });

      if (outcome === "downloaded") {
        setToastMessage(t("chat.share.fallbackToast"));
      }
    } catch {
      setToastMessage(t("chat.share.error"));
    } finally {
      setIsSharing(false);
    }
  }, [messages, season, t]);

  return (
    // Genuinely full-width/full-height on desktop, like WhatsApp Web/Slack/
    // ChatGPT — not a centered card with empty page showing on both sides.
    // Each bar below (header, season strip, message list, input) spans the
    // full width itself; only the CONTENT inside each is centered to a
    // comfortable max-width, so text/controls don't stretch uncomfortably
    // wide on an ultrawide monitor while the screen still reads as fully used.
    <div className="flex h-dvh flex-col bg-parchment">
      <ChatHeader
        actionsDisabled={!hasConversation}
        isSharing={isSharing}
        onDeleteRequest={() => setIsDeleteDialogOpen(true)}
        onShare={handleShare}
      />
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

      <DeleteConversationDialog
        open={isDeleteDialogOpen}
        isDeleting={isDeleting}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
      <ChatToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}

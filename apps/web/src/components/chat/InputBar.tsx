"use client";

import { useRef, useState, type FormEvent } from "react";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { RecordingIndicator } from "./RecordingIndicator";

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp";

export function InputBar({
  onSend,
  onVoiceMessage,
  onPhotoMessage,
  disabled,
}: {
  onSend: (text: string) => void;
  onVoiceMessage: (blob: Blob) => void;
  onPhotoMessage: (file: File) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceRecorder = useVoiceRecorder(onVoiceMessage);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) {
      return;
    }
    onSend(trimmed);
    setText("");
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so selecting the exact same file again still fires onChange.
    event.target.value = "";
    if (file) {
      onPhotoMessage(file);
    }
  }

  if (voiceRecorder.status === "recording") {
    return <RecordingIndicator elapsedMs={voiceRecorder.elapsedMs} onStop={voiceRecorder.stopRecording} />;
  }

  if (voiceRecorder.status === "permission-denied") {
    return (
      <div className="border-t border-parchment-2 bg-white px-3 py-2 text-sm text-ink">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <span>Couldn't access your microphone — check your browser's site permissions to allow it.</span>
          <button
            type="button"
            onClick={voiceRecorder.dismissMessage}
            className="shrink-0 rounded-full bg-parchment-3 px-3 py-1 text-xs font-medium text-sage-dark hover:bg-parchment-2"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  if (voiceRecorder.status === "unsupported") {
    return (
      <div className="border-t border-parchment-2 bg-white px-3 py-2 text-sm text-ink">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <span>Voice recording isn't supported in this browser.</span>
          <button
            type="button"
            onClick={voiceRecorder.dismissMessage}
            className="shrink-0 rounded-full bg-parchment-3 px-3 py-1 text-xs font-medium text-sage-dark hover:bg-parchment-2"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-parchment-2 bg-white px-3 py-2">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
        <button
          type="button"
          onClick={voiceRecorder.startRecording}
          disabled={disabled}
          title="Record a voice message"
          aria-label="Record a voice message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-ink-soft transition-colors hover:bg-parchment-3 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-dark"
        >
          🎙️
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Send a photo"
          aria-label="Send a photo"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-ink-soft transition-colors hover:bg-parchment-3 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-dark"
        >
          📷
        </button>
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type a message…"
          aria-label="Message"
          disabled={disabled}
          className="min-w-0 flex-1 rounded-full border border-parchment-2 bg-parchment px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-sage disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage text-white transition-colors hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-dark"
        >
          ➤
        </button>
      </div>
    </form>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";

const MAX_RECORDING_MS = 30_000;

export type VoiceRecorderStatus = "idle" | "recording" | "permission-denied" | "unsupported";

/**
 * Thin wrapper around the browser's native MediaRecorder API — deliberately no
 * recording library, to keep the bundle lean for low-end Android devices.
 */
export function useVoiceRecorder(onRecordingComplete: (blob: Blob) => void) {
  const [status, setStatus] = useState<VoiceRecorderStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const autoStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanupTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoStopTimeoutRef.current) clearTimeout(autoStopTimeoutRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    timerRef.current = null;
    autoStopTimeoutRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const startRecording = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus("unsupported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        cleanupTimers();
        setStatus("idle");
        setElapsedMs(0);
        onRecordingComplete(blob);
      };

      recorder.start();
      setStatus("recording");
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 200);
      autoStopTimeoutRef.current = setTimeout(stopRecording, MAX_RECORDING_MS);
    } catch {
      // Covers permission denial and any getUserMedia failure — we can't
      // reliably distinguish "denied" from "no microphone" across browsers,
      // and the calm message we show works for either case.
      setStatus("permission-denied");
    }
  }, [cleanupTimers, onRecordingComplete, stopRecording]);

  const dismissMessage = useCallback(() => setStatus("idle"), []);

  return { status, elapsedMs, startRecording, stopRecording, dismissMessage };
}

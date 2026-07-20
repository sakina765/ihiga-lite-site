"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

interface ChatToastProps {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}

/**
 * A brief, dismissible banner for feedback that doesn't warrant a modal —
 * currently just the WhatsApp-share fallback explanation (desktop browsers
 * can't auto-attach a file to a wa.me link, so the farmer needs to be told
 * the PDF downloaded and WhatsApp is opening separately).
 */
export function ChatToast({ message, onDismiss, durationMs = 6000 }: ChatToastProps) {
  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          role="status"
          className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4"
        >
          <div className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-full bg-soil-deep px-4 py-3 text-sm text-parchment shadow-xl shadow-soil/30">
            <span className="flex-1">{message}</span>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="shrink-0 text-parchment/60 transition-colors hover:text-parchment"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

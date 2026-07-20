"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLanguage } from "../../i18n/LanguageProvider";

interface DeleteConversationDialogProps {
  open: boolean;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * A destructive action (wipes message history) gets an explicit confirm step
 * rather than firing straight off the menu tap — cheap to add, and the only
 * thing standing between an accidental tap and a farmer's chat history
 * disappearing with no undo.
 */
export function DeleteConversationDialog({ open, isDeleting, onCancel, onConfirm }: DeleteConversationDialogProps) {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-soil-deep/60 px-6 backdrop-blur-[2px]"
          onClick={onCancel}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-conversation-title"
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl shadow-soil/30"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-clay/15 text-clay">
              <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 7h16" />
                <path d="M10 11v6M14 11v6" />
                <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
                <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h2 id="delete-conversation-title" className="text-center text-lg font-semibold text-ink">
              {t("chat.deleteDialog.title")}
            </h2>
            <p className="mt-2 text-center text-sm text-ink-soft">{t("chat.deleteDialog.body")}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isDeleting}
                className="flex-1 rounded-full border border-parchment-2 px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-parchment-3 disabled:opacity-50"
              >
                {t("chat.deleteDialog.cancel")}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 rounded-full bg-clay px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-clay/90 disabled:opacity-60"
              >
                {isDeleting ? t("chat.deleteDialog.deleting") : t("chat.deleteDialog.confirm")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

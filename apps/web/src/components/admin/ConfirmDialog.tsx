"use client";

/**
 * Generic destructive-action confirm dialog for the admin panel — same
 * clay/alertdialog visual language as the farmer-facing
 * DeleteConversationDialog, just plain English strings instead of i18n keys
 * (the admin panel is English-only, internal-tool scope).
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Delete",
  isBusy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-soil-deep/60 px-6 backdrop-blur-[2px]"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
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
        <h2 id="confirm-dialog-title" className="text-center text-lg font-semibold text-ink">
          {title}
        </h2>
        <p className="mt-2 text-center text-sm text-ink-soft">{body}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="flex-1 rounded-full border border-parchment-2 px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-parchment-3 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className="flex-1 rounded-full bg-clay px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-clay/90 disabled:opacity-60"
          >
            {isBusy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

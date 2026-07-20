"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LineIcon } from "../icons/lineIcons";
import { SocialIcon } from "../icons/socialIcons";
import { useLanguage } from "../../i18n/LanguageProvider";

interface ChatActionsMenuProps {
  disabled?: boolean;
  isSharing?: boolean;
  onDeleteRequest: () => void;
  onShare: () => void;
}

/**
 * The chat page's overflow menu (kebab button) — mirrors where WhatsApp/
 * Telegram tuck "Clear chat"/"Export chat" rather than adding more permanent
 * buttons to an already-tight header (back arrow, avatar, name, language
 * switcher). Closes on outside click, Escape, or picking an item.
 */
export function ChatActionsMenu({ disabled, isSharing, onDeleteRequest, onShare }: ChatActionsMenuProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t("chat.actions.menuAria")}
        className="flex h-9 w-9 items-center justify-center rounded-full text-parchment/80 transition-colors hover:bg-parchment/10 hover:text-parchment disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
      >
        <LineIcon name="moreVertical" size={20} strokeWidth={1.8} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-11 z-30 w-56 overflow-hidden rounded-xl border border-parchment-2 bg-white py-1.5 shadow-xl shadow-soil/20"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onShare();
              }}
              disabled={isSharing}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-parchment-3 disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="text-[#25D366]" aria-hidden="true">
                <SocialIcon name="whatsapp" size={18} />
              </span>
              <span className="flex-1">{isSharing ? t("chat.actions.sharing") : t("chat.actions.share")}</span>
            </button>

            <div className="mx-2 my-1 h-px bg-parchment-2" aria-hidden="true" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onDeleteRequest();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-clay transition-colors hover:bg-clay/10"
            >
              <LineIcon name="trash" size={18} strokeWidth={1.8} />
              <span>{t("chat.actions.delete")}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

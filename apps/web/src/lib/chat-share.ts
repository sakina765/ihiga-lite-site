import type { jsPDF } from "jspdf";
import { chatTranscriptPdfBlob, downloadChatTranscriptPdf } from "./chat-pdf";

export type ShareOutcome = "shared" | "downloaded" | "cancelled";

interface ShareChatPdfOptions {
  filename: string;
  shareTitle: string;
  shareText: string;
  /** Prefilled message for the wa.me fallback — WhatsApp has no URL param for attaching a file, so this just asks the farmer to attach the PDF that was just downloaded. */
  whatsappFallbackText: string;
}

function canShareFiles(file: File): boolean {
  return typeof navigator !== "undefined" && "share" in navigator && "canShare" in navigator && navigator.canShare({ files: [file] });
}

/**
 * Shares a chat transcript PDF to WhatsApp. Two paths, depending on what the
 * device actually supports:
 *
 * 1. Web Share API with files (real support on Android/iOS browsers) — hands
 *    the PDF straight to the OS share sheet, where the farmer picks WhatsApp
 *    and the file arrives as a genuine attachment.
 * 2. Everywhere else (most desktop browsers) — WhatsApp's wa.me link can only
 *    prefill a text message, not attach a file (no such API exists), so this
 *    downloads the PDF for real and opens WhatsApp with a message asking the
 *    farmer to attach it. The caller should surface this distinction to the
 *    farmer rather than imply the file was sent automatically.
 */
export async function shareChatPdfViaWhatsApp(doc: jsPDF, options: ShareChatPdfOptions): Promise<ShareOutcome> {
  const blob = chatTranscriptPdfBlob(doc);
  const file = new File([blob], options.filename, { type: "application/pdf" });

  if (canShareFiles(file)) {
    try {
      await navigator.share({ files: [file], title: options.shareTitle, text: options.shareText });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return "cancelled";
      }
      // Fall through to the download + wa.me fallback below.
    }
  }

  downloadChatTranscriptPdf(doc, options.filename);
  window.open(`https://wa.me/?text=${encodeURIComponent(options.whatsappFallbackText)}`, "_blank", "noopener,noreferrer");
  return "downloaded";
}

import { jsPDF } from "jspdf";

export interface ChatPdfMessage {
  role: "user" | "bot";
  text: string;
  timestamp: number;
  inputType?: "text" | "voice" | "photo";
}

export interface ChatPdfCopy {
  docTitle: string;
  subtitle?: string;
  generatedOnLabel: string;
  youLabel: string;
  botLabel: string;
  photoPlaceholder: string;
  photoTag: string;
  voiceTag: string;
  footerBrand: string;
  /** Must contain the literal tokens "{current}" and "{total}". */
  pageLabelTemplate: string;
}

// jsPDF's built-in Helvetica only covers WinAnsi (Latin-1) — French accents
// render fine, but emoji (used liberally in the on-screen UI copy) come out
// as missing-glyph boxes. Stripped once, centrally, rather than trusting
// every call site to remember not to pass emoji in.
const EMOJI_RE = /[\u{2190}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1FAFF}\u{FE0F}]/gu;

function clean(text: string): string {
  return text.replace(EMOJI_RE, "").replace(/\s+/g, " ").trim();
}

// Hex values pulled straight from tailwind.config.ts so the PDF reads as an
// extension of the app's own visual identity, not a generic export.
const COLOR = {
  soilDeep: [31, 42, 26] as [number, number, number],
  sageDark: [74, 90, 56] as [number, number, number],
  leaf: [157, 176, 130] as [number, number, number],
  parchment: [240, 237, 226] as [number, number, number],
  parchment2: [232, 230, 216] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  ink: [44, 58, 38] as [number, number, number],
  inkFaint: [122, 133, 104] as [number, number, number],
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 16;
const HEADER_HEIGHT = 32;
const FOOTER_Y = PAGE_HEIGHT - 14;
const CONTENT_RIGHT = PAGE_WIDTH - MARGIN_X;
const BUBBLE_MAX_WIDTH = 130;
const BUBBLE_MIN_WIDTH = 30;
const BUBBLE_PADDING = 4;
const BODY_FONT_SIZE = 10.5;
const TAG_FONT_SIZE = 8;
const BODY_LINE_HEIGHT = 5;
const TAG_LINE_HEIGHT = 3.8;

function formatTimestamp(ts: number): string {
  if (!ts) {
    return "";
  }
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
    new Date(ts),
  );
}

function drawTitleBand(doc: jsPDF, copy: ChatPdfCopy) {
  doc.setFillColor(...COLOR.soilDeep);
  doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, "F");

  doc.setTextColor(...COLOR.parchment);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(clean(copy.docTitle), MARGIN_X, 15);

  doc.setTextColor(...COLOR.leaf);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  if (copy.subtitle) {
    doc.text(clean(copy.subtitle), MARGIN_X, 22);
  }

  doc.setTextColor(...COLOR.parchment);
  doc.setFontSize(8);
  doc.text(clean(copy.generatedOnLabel), CONTENT_RIGHT, 15, { align: "right" });
}

function drawContinuationHeader(doc: jsPDF, copy: ChatPdfCopy) {
  doc.setTextColor(...COLOR.inkFaint);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.text(clean(copy.docTitle), MARGIN_X, 12);
  doc.setDrawColor(...COLOR.parchment2);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, 15, CONTENT_RIGHT, 15);
}

function addFooters(doc: jsPDF, copy: ChatPdfCopy) {
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...COLOR.parchment2);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_X, FOOTER_Y, CONTENT_RIGHT, FOOTER_Y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR.inkFaint);
    doc.text(clean(copy.footerBrand), MARGIN_X, FOOTER_Y + 6);

    const pageLabel = copy.pageLabelTemplate.replace("{current}", String(page)).replace("{total}", String(totalPages));
    doc.text(clean(pageLabel), CONTENT_RIGHT, FOOTER_Y + 6, { align: "right" });
  }
}

function maxLineWidth(doc: jsPDF, lines: string[]): number {
  return lines.reduce((widest, line) => Math.max(widest, doc.getTextWidth(line)), 0);
}

/**
 * Builds a branded, print-ready PDF transcript of a chat conversation — used
 * by the chat page's "Share via WhatsApp" action, since WhatsApp has no way
 * to receive a live conversation feed, only a file. Error bubbles (transient
 * UI state, never a real exchange) are skipped; everything else appears in
 * chronological order, styled to match the on-screen message bubbles.
 */
export function buildChatTranscriptPdf(messages: ChatPdfMessage[], copy: ChatPdfCopy): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  drawTitleBand(doc, copy);

  let y = HEADER_HEIGHT + 10;

  const contentWidth = BUBBLE_MAX_WIDTH - BUBBLE_PADDING * 2;

  for (const message of messages) {
    const isUser = message.role === "user";
    const tag = message.inputType === "photo" ? copy.photoTag : message.inputType === "voice" ? copy.voiceTag : null;
    const bodyText = clean(
      message.inputType === "photo" && !message.text.trim() ? copy.photoPlaceholder : message.text || " ",
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_FONT_SIZE);
    const bodyLines: string[] = doc.splitTextToSize(bodyText, contentWidth);

    let tagLines: string[] = [];
    if (tag) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(TAG_FONT_SIZE);
      tagLines = doc.splitTextToSize(clean(tag), contentWidth);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_FONT_SIZE);
    const bodyWidth = maxLineWidth(doc, bodyLines);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(TAG_FONT_SIZE);
    const tagWidth = maxLineWidth(doc, tagLines);

    const bubbleWidth = Math.min(
      BUBBLE_MAX_WIDTH,
      Math.max(BUBBLE_MIN_WIDTH, Math.max(bodyWidth, tagWidth) + BUBBLE_PADDING * 2),
    );
    const tagBlockHeight = tagLines.length > 0 ? tagLines.length * TAG_LINE_HEIGHT + 1.5 : 0;
    const bubbleHeight = BUBBLE_PADDING * 2 + tagBlockHeight + bodyLines.length * BODY_LINE_HEIGHT;
    const senderLabel = isUser ? copy.youLabel : copy.botLabel;
    const timestampText = formatTimestamp(message.timestamp);
    const captionText = clean(timestampText ? `${senderLabel} · ${timestampText}` : senderLabel);
    const rowHeight = bubbleHeight + 6 + 5;

    if (y + rowHeight > FOOTER_Y) {
      doc.addPage();
      drawContinuationHeader(doc, copy);
      y = 24;
    }

    const bubbleX = isUser ? CONTENT_RIGHT - bubbleWidth : MARGIN_X;

    doc.setFillColor(...(isUser ? COLOR.sageDark : COLOR.white));
    if (!isUser) {
      doc.setDrawColor(...COLOR.parchment2);
      doc.setLineWidth(0.3);
      doc.roundedRect(bubbleX, y, bubbleWidth, bubbleHeight, 2.5, 2.5, "FD");
    } else {
      doc.roundedRect(bubbleX, y, bubbleWidth, bubbleHeight, 2.5, 2.5, "F");
    }

    let textY = y + BUBBLE_PADDING + 3;
    const textX = bubbleX + BUBBLE_PADDING;

    if (tagLines.length > 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(TAG_FONT_SIZE);
      doc.setTextColor(...(isUser ? COLOR.leaf : COLOR.inkFaint));
      for (const line of tagLines) {
        doc.text(line, textX, textY);
        textY += TAG_LINE_HEIGHT;
      }
      textY += 1.5;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_FONT_SIZE);
    doc.setTextColor(...(isUser ? COLOR.parchment : COLOR.ink));
    for (const line of bodyLines) {
      doc.text(line, textX, textY);
      textY += BODY_LINE_HEIGHT;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR.inkFaint);
    doc.text(captionText, isUser ? CONTENT_RIGHT : MARGIN_X, y + bubbleHeight + 4.5, {
      align: isUser ? "right" : "left",
    });

    y = y + bubbleHeight + 6 + 5;
  }

  addFooters(doc, copy);
  return doc;
}

export function chatTranscriptPdfBlob(doc: jsPDF): Blob {
  return doc.output("blob");
}

export function downloadChatTranscriptPdf(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

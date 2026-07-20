export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const MAX_AI_TEXT_DISPLAY_LENGTH = 2000;

/**
 * Bounds how much of a Groq-generated string (replyText, a suggested chip)
 * actually renders — React already escapes everything, so this isn't an XSS
 * defense, just a layout/performance backstop in case a manipulated model
 * response ever returns an unusually long payload. Only ever apply this to
 * the rendered copy, never to a value used for anything else (e.g. a chip's
 * exact text is still what gets sent when tapped — truncating that too
 * would break the confirm/decline chip-text matching in the backend).
 */
export function truncateForDisplay(text: string, maxLength: number = MAX_AI_TEXT_DISPLAY_LENGTH): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}…`;
}

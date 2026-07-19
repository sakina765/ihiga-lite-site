import { memo, useId } from "react";
import { LINE_ICONS } from "./icons/lineIcons";

// Tile size + scatter layout chosen once, offline (see the placements list
// below) rather than at render time with Math.random() — that would cause a
// server/client hydration mismatch (different random values each render) and
// would also mean the "static texture" re-computes on every re-render instead
// of being truly constant.
const TILE_SIZE = 700;

// Hand-tuned once (jittered-grid scatter, not a literal random() call) —
// sized against a real WhatsApp wallpaper screenshot for reference (icons
// there read as clearly recognizable individual shapes, not a fine noise
// texture). Icon scale (2.3-3.6) matches that reference; the tile itself is
// large (700px) with 64 instances at that same density so the repeat isn't
// an obvious visual rhythm on a wide desktop screen — a smaller tile at this
// icon size showed a noticeably repeating cluster. See project notes if this
// ever needs regenerating.
const PLACEMENTS: Array<{ icon: keyof typeof LINE_ICONS; x: number; y: number; rotate: number; scale: number }> = [
  { icon: "clock", x: 200.7, y: 413.1, rotate: 12, scale: 3.27 },
  { icon: "leaf", x: 658.2, y: 478.1, rotate: -8, scale: 3.3 },
  { icon: "twoHands", x: 46.1, y: 220.8, rotate: 30, scale: 2.67 },
  { icon: "phone", x: 548.8, y: 378.6, rotate: 0, scale: 3.25 },
  { icon: "circuitNode", x: 390.8, y: 379.7, rotate: 12, scale: 2.4 },
  { icon: "calendar", x: 571.4, y: 570.5, rotate: -12, scale: 3.45 },
  { icon: "wateringCan", x: 413.0, y: 56.3, rotate: 18, scale: 2.65 },
  { icon: "heart", x: 387.0, y: 548.7, rotate: -18, scale: 3.27 },
  { icon: "arrowUp", x: 302.1, y: 581.1, rotate: -30, scale: 2.53 },
  { icon: "person", x: 41.6, y: 565.5, rotate: -25, scale: 2.85 },
  { icon: "checkmark", x: 471.9, y: 485.3, rotate: 0, scale: 3.24 },
  { icon: "wheat", x: 380.2, y: 220.1, rotate: -8, scale: 3.47 },
  { icon: "smiley", x: 638.9, y: 59.6, rotate: 30, scale: 3.46 },
  { icon: "plantStages", x: 213.6, y: 548.5, rotate: 0, scale: 3.09 },
  { icon: "lightbulb", x: 560.0, y: 298.7, rotate: 0, scale: 3.35 },
  { icon: "chatBubble", x: 121.7, y: 586.8, rotate: -18, scale: 2.8 },
  { icon: "seedling", x: 390.4, y: 494.5, rotate: 0, scale: 3.28 },
  { icon: "handshake", x: 672.4, y: 132.9, rotate: 18, scale: 2.42 },
  { icon: "cloudRain", x: 206.9, y: 646.3, rotate: 30, scale: 2.49 },
  { icon: "sun", x: 300.8, y: 398.8, rotate: -25, scale: 2.66 },
  { icon: "arrowUp", x: 230.1, y: 110.6, rotate: -30, scale: 2.64 },
  { icon: "smiley", x: 146.0, y: 120.6, rotate: 8, scale: 3.12 },
  { icon: "wheat", x: 637.0, y: 581.7, rotate: -8, scale: 2.56 },
  { icon: "plantStages", x: 134.0, y: 311.4, rotate: 25, scale: 2.42 },
  { icon: "calendar", x: 228.8, y: 214.4, rotate: 12, scale: 2.77 },
  { icon: "twoHands", x: 326.7, y: 136.5, rotate: 18, scale: 3.15 },
  { icon: "leaf", x: 29.9, y: 501.3, rotate: 18, scale: 2.54 },
  { icon: "checkmark", x: 198.6, y: 485.9, rotate: -18, scale: 3.51 },
  { icon: "handshake", x: 560.1, y: 672.9, rotate: -8, scale: 3.04 },
  { icon: "wateringCan", x: 142.6, y: 494.8, rotate: 8, scale: 3.29 },
  { icon: "seedling", x: 464.6, y: 199.0, rotate: 0, scale: 2.42 },
  { icon: "lightbulb", x: 671.2, y: 206.4, rotate: 0, scale: 3.59 },
  { icon: "person", x: 229.6, y: 32.1, rotate: 8, scale: 3.42 },
  { icon: "sun", x: 478.6, y: 125.5, rotate: 12, scale: 2.59 },
  { icon: "chatBubble", x: 308.8, y: 53.9, rotate: 0, scale: 3.45 },
  { icon: "phone", x: 501.5, y: 676.5, rotate: -18, scale: 2.76 },
  { icon: "circuitNode", x: 64.0, y: 648.3, rotate: -30, scale: 2.94 },
  { icon: "heart", x: 37.5, y: 381.6, rotate: 12, scale: 3.0 },
  { icon: "clock", x: 294.1, y: 477.3, rotate: -30, scale: 2.35 },
  { icon: "cloudRain", x: 228.7, y: 305.1, rotate: -18, scale: 3.07 },
  { icon: "phone", x: 652.7, y: 295.6, rotate: 0, scale: 2.35 },
  { icon: "twoHands", x: 385.2, y: 669.6, rotate: 0, scale: 3.37 },
  { icon: "plantStages", x: 571.9, y: 63.4, rotate: 0, scale: 3.47 },
  { icon: "handshake", x: 311.8, y: 669.4, rotate: -18, scale: 3.49 },
  { icon: "chatBubble", x: 501.5, y: 313.0, rotate: 0, scale: 3.58 },
  { icon: "sun", x: 654.4, y: 372.9, rotate: 12, scale: 2.8 },
  { icon: "lightbulb", x: 550.1, y: 111.7, rotate: 0, scale: 2.76 },
  { icon: "heart", x: 62.4, y: 51.0, rotate: 12, scale: 3.44 },
  { icon: "cloudRain", x: 403.0, y: 291.3, rotate: -25, scale: 3.28 },
  { icon: "arrowUp", x: 144.3, y: 217.2, rotate: 25, scale: 2.46 },
  { icon: "wateringCan", x: 375.6, y: 130.1, rotate: -18, scale: 3.57 },
  { icon: "calendar", x: 581.3, y: 465.2, rotate: -30, scale: 3.28 },
  { icon: "wheat", x: 48.2, y: 132.6, rotate: -12, scale: 3.41 },
  { icon: "checkmark", x: 580.6, y: 210.9, rotate: 18, scale: 2.67 },
  { icon: "person", x: 131.0, y: 395.7, rotate: 25, scale: 3.0 },
  { icon: "smiley", x: 37.0, y: 316.3, rotate: -12, scale: 3.33 },
  { icon: "seedling", x: 309.2, y: 323.1, rotate: -18, scale: 2.38 },
  { icon: "clock", x: 318.0, y: 203.6, rotate: -25, scale: 3.21 },
  { icon: "leaf", x: 648.3, y: 645.8, rotate: 30, scale: 3.06 },
  { icon: "circuitNode", x: 145.1, y: 63.2, rotate: -30, scale: 3.24 },
  { icon: "phone", x: 500.5, y: 49.3, rotate: 0, scale: 2.64 },
  { icon: "lightbulb", x: 483.1, y: 565.5, rotate: 12, scale: 3.14 },
  { icon: "twoHands", x: 147.0, y: 643.5, rotate: 18, scale: 3.16 },
  { icon: "heart", x: 488.7, y: 400.3, rotate: -18, scale: 2.53 },
];

/**
 * Subtle repeating icon-pattern wallpaper for the chat message canvas, styled
 * after chat-app backgrounds (WhatsApp etc.) but with an original icon set.
 * Pure/prop-less and wrapped in memo() so it never re-renders once mounted —
 * this is a static decorative layer, not something that should redraw as
 * messages arrive or the list scrolls.
 *
 * PATTERN_OPACITY (8%) is the measured ceiling, not a guess: at that opacity
 * the worst-case blended background (a timestamp sitting directly over an
 * icon overlap) still holds ~4.64:1 contrast against ink-soft text — just
 * clear of WCAG AA's 4.5:1 floor for normal-size text. 10% already fails
 * (~4.48:1), so this is picked right at the edge, deliberately, not eyeballed.
 */
// Rendered stroke width, in final screen pixels, for every icon regardless of
// its individual `scale`. Without this, a `scale(0.4)` instance's strokeWidth
// shrinks right along with it — 1.4 (already thin) becomes ~0.5px, which is
// sub-pixel on a standard-density display and effectively invisible. Each
// instance below divides this constant by its own scale so the *shape*
// scales but the *line weight* doesn't.
const STROKE_WIDTH = 2.0;
// 8% is the measured ceiling, not a guess: at 10% the worst-case blended
// background (an icon overlapping a timestamp) drops ink-soft text to
// 4.48:1 — just under WCAG AA's 4.5:1 floor. 8% holds ~4.64:1.
const PATTERN_OPACITY = 0.08;

function ChatBackgroundPatternImpl() {
  // Unique per mounted instance. This component is now reused in more than
  // one place on the same page at once (main chat + sidebar) — a hardcoded
  // id here would mean multiple <pattern id="..."> elements sharing one id,
  // which is invalid HTML. fill="url(#id)" resolves document-wide, not
  // scoped to the local <svg>, so with a shared id only ONE instance would
  // actually paint and the rest would silently render nothing. useId() is
  // also SSR/hydration-safe (deterministic per render tree position), same
  // as the no-Math.random() reasoning above.
  const patternId = useId();

  return (
    <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute inset-0 h-full w-full">
      <defs>
        <pattern id={patternId} patternUnits="userSpaceOnUse" width={TILE_SIZE} height={TILE_SIZE}>
          <g fill="none" stroke="#2C3A26" strokeLinecap="round" strokeLinejoin="round" opacity={PATTERN_OPACITY}>
            {PLACEMENTS.map((p, i) => (
              <g
                key={i}
                transform={`translate(${p.x} ${p.y}) rotate(${p.rotate}) scale(${p.scale})`}
                strokeWidth={STROKE_WIDTH / p.scale}
              >
                {LINE_ICONS[p.icon]}
              </g>
            ))}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

export const ChatBackgroundPattern = memo(ChatBackgroundPatternImpl);

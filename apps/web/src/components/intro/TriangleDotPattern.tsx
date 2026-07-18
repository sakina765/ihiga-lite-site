"use client";

import { motion } from "motion/react";

const TILE_WIDTH = 64;
const TILE_HEIGHT = 40;
// Wide enough (60 * 64 = 3840px per copy) that the seam between the two
// duplicated copies always falls off-screen, on any realistic viewport width —
// cheaper and simpler than measuring the container and computing an exact count.
const TILES_PER_COPY = 60;
const COPY_WIDTH_PX = TILE_WIDTH * TILES_PER_COPY;
// Parchment reads cleanly against the dark soil-green background without the
// starkness of pure white.
const ACCENT_COLOR = "#F0EDE2";

// The tiles themselves are a fixed 64px, the same on a phone or a desktop
// monitor — so "moving at the same speed" means constant PIXELS PER SECOND
// (how fast one 64px triangle slides past a fixed point on screen), not
// constant "screen-widths per second". An earlier revision of this file
// scaled the duration by viewport width to keep screen-widths/sec constant,
// which actually reproduced the exact original mismatch (72px/s on a 1440px
// desktop vs 19.5px/s on a 390px phone) through more "correct-looking" math —
// still two different absolute speeds, so still visibly different. A single
// fixed px/sec constant, applied identically on every device, is what
// actually makes them match.
const PIXELS_PER_SECOND = 72;
const DURATION_SECONDS = COPY_WIDTH_PX / PIXELS_PER_SECOND;

/**
 * One zigzag "period": a solid triangle immediately followed by a hollow one,
 * sharing baseline points so adjacent tiles continue the zigzag line
 * seamlessly, plus a dot centered beneath each triangle.
 */
function PatternTile() {
  return (
    <svg viewBox={`0 0 ${TILE_WIDTH} ${TILE_HEIGHT}`} width={TILE_WIDTH} height={TILE_HEIGHT} className="block shrink-0">
      <path d="M0,30 L16,8 L32,30 Z" fill={ACCENT_COLOR} />
      <path d="M32,30 L48,8 L64,30 Z" fill="none" stroke={ACCENT_COLOR} strokeWidth="2" />
      <circle cx="16" cy="36" r="2.5" fill={ACCENT_COLOR} />
      <circle cx="48" cy="36" r="2.5" fill={ACCENT_COLOR} />
    </svg>
  );
}

function TileRow() {
  return (
    <div className="flex shrink-0">
      {Array.from({ length: TILES_PER_COPY }, (_, i) => (
        <PatternTile key={i} />
      ))}
    </div>
  );
}

/**
 * A continuously scrolling (right-to-left) strip of the triangle/dot motif.
 * Renders the tile row twice back-to-back and animates translateX from 0 to
 * -50% — since the two copies are pixel-identical, the loop reset is
 * invisible. Falls back to a static (non-animated) strip under
 * prefers-reduced-motion.
 */
export function TriangleDotStrip({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="w-full overflow-hidden" style={{ height: TILE_HEIGHT }} aria-hidden="true">
      <motion.div
        className="flex"
        // Without an explicit width, this being a normal block-level flex
        // container means it takes its width from its PARENT (the
        // viewport-wide wrapper above), not from its two 3840px-wide
        // children — so "-50%" was silently resolving against the
        // viewport's width instead of "exactly one copy", making the real
        // scroll distance (and therefore speed) depend on viewport size.
        // Forcing the real 2*COPY_WIDTH_PX content width here is what makes
        // "-50%" actually mean "one copy's width" on every device.
        style={{ width: COPY_WIDTH_PX * 2, willChange: reduceMotion ? undefined : "transform" }}
        animate={reduceMotion ? undefined : { x: ["0%", "-50%"] }}
        transition={reduceMotion ? undefined : { duration: DURATION_SECONDS, ease: "linear", repeat: Infinity }}
      >
        <TileRow />
        <TileRow />
      </motion.div>
    </div>
  );
}

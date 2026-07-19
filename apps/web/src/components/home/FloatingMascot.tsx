"use client";

import Image from "next/image";
import { motion } from "motion/react";
import robotImage from "../../app/ihiga robot.png";
import { usePrefersReducedMotion } from "../intro/usePrefersReducedMotion";

// Shared between the image and its shadow so they stay perfectly in phase —
// same duration/easing means their keyframe fractions line up exactly.
const FLOAT_TRANSITION = { duration: 4.5, repeat: Infinity, ease: "easeInOut" } as const;

/**
 * Gentle infinite float/bob for the "What Ihiga does" section's mascot —
 * purely decorative, so a reduced-motion preference gets the plain static
 * image instead of a shortened loop, matching this project's existing
 * motion-gating convention (see ScrollReveal, IntroSplash).
 *
 * The ground shadow beneath it breathes opposite the float (shrinks + fades
 * as the robot rises, grows + darkens as it settles) — a real object's
 * shadow gets smaller and softer the further it lifts off the ground, so
 * this is what actually sells the floating illusion rather than the
 * robot just sliding up and down against a flat background.
 */
export function FloatingMascot() {
  const prefersReducedMotion = usePrefersReducedMotion();

  const image = <Image src={robotImage} alt="" className="h-auto w-full select-none object-contain" />;
  {/* blur-md (12px) on a shape this thin (14-16px tall) over-diffuses it to
      near-invisible — a blur radius close to the shape's own size dilutes
      the peak opacity across a much wider area than the shadow itself.
      blur-sm (4px) keeps a soft edge without erasing the shadow. */}
  const shadow = <div className="mx-auto h-3.5 w-28 rounded-full bg-ink/35 blur-sm sm:h-4 sm:w-32" aria-hidden="true" />;

  if (prefersReducedMotion) {
    return (
      <div className="mx-auto w-48 sm:w-56 lg:w-full">
        {image}
        <div className="-mt-3">{shadow}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-48 sm:w-56 lg:w-full">
      <motion.div animate={{ y: [0, -14, 0] }} transition={FLOAT_TRANSITION}>
        {image}
      </motion.div>
      <motion.div
        className="-mt-3"
        animate={{ scaleX: [1, 0.65, 1], opacity: [1, 0.45, 1] }}
        transition={FLOAT_TRANSITION}
      >
        {shadow}
      </motion.div>
    </div>
  );
}

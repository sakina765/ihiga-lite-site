"use client";

import { motion } from "motion/react";

const DOT_COUNT = 14;
const WAVE_SECONDS = 1.6;
const STAGGER_SECONDS = 0.09;
// #9DB082 (theme's "leaf" color) — hardcoded here since Framer Motion
// interpolates boxShadow as raw strings, not Tailwind classes.
const GLOW_RGB = "157,176,130";

export function IntroLoadingIndicator({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1.5 sm:gap-2">
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-leaf sm:h-2 sm:w-2"
            animate={
              reduceMotion
                ? { opacity: 0.6 }
                : {
                    scale: [0.55, 1.35, 0.55],
                    opacity: [0.3, 1, 0.3],
                    boxShadow: [
                      `0 0 0px 0px rgba(${GLOW_RGB},0)`,
                      `0 0 10px 2px rgba(${GLOW_RGB},0.85)`,
                      `0 0 0px 0px rgba(${GLOW_RGB},0)`,
                    ],
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: WAVE_SECONDS,
                    repeat: Infinity,
                    delay: i * STAGGER_SECONDS,
                    ease: "easeInOut",
                  }
            }
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import Image, { type StaticImageData } from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "../intro/usePrefersReducedMotion";

const SLIDE_INTERVAL_MS = 3000;
const CROSSFADE_SECONDS = 1;

/**
 * Crossfades through a fixed set of hero background photos on a timer.
 * Respects prefers-reduced-motion by simply never advancing past the first
 * image, rather than swapping instantly without the fade (an abrupt cut
 * every 3s is its own kind of motion most reduced-motion users don't want
 * either).
 */
export function HeroBackgroundSlider({ images }: { images: StaticImageData[] }) {
  const [index, setIndex] = useState(0);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reduceMotion || images.length <= 1) {
      return;
    }
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [reduceMotion, images.length]);

  return (
    <AnimatePresence>
      {images.map(
        (image, i) =>
          i === index && (
            <motion.div
              key={i}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: CROSSFADE_SECONDS, ease: "easeInOut" }}
            >
              <Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />
            </motion.div>
          ),
      )}
    </AnimatePresence>
  );
}

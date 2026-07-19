"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import logo from "../app/Ihiga3d.png";
import { TriangleDotStrip } from "./intro/TriangleDotPattern";
import { IntroLoadingIndicator } from "./intro/IntroLoadingIndicator";
import { usePrefersReducedMotion } from "./intro/usePrefersReducedMotion";
import { useLanguage } from "../i18n/LanguageProvider";

const AUTO_ADVANCE_MS = 3000;
// Avoids an accidental tap in the first instant (before anything's even
// visible) from immediately skipping the intro.
const SKIP_ENABLE_DELAY_MS = 500;
const EXIT_SECONDS = 0.4;
// How far the whole scene punches in on exit — a quick zoom-and-vanish
// rather than a plain fade.
const EXIT_ZOOM_SCALE = 1.2;

export function IntroSplash({ onComplete }: { onComplete: () => void }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { t } = useLanguage();
  const [canSkip, setCanSkip] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const hasExitedRef = useRef(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The overlay mounts client-side (after IntroGate's localStorage check),
    // well after the initial paint — the HTML `autofocus` attribute only
    // takes effect for elements present during the document's initial parse,
    // so a plain `autoFocus` prop silently fails to move focus here. Calling
    // .focus() explicitly is what actually makes Enter/Space work immediately.
    overlayRef.current?.focus();

    const skipTimer = setTimeout(() => setCanSkip(true), SKIP_ENABLE_DELAY_MS);
    const advanceTimer = setTimeout(() => beginExit(), AUTO_ADVANCE_MS);
    return () => {
      clearTimeout(skipTimer);
      clearTimeout(advanceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function beginExit() {
    if (hasExitedRef.current) {
      return;
    }
    hasExitedRef.current = true;
    setIsExiting(true);
  }

  function handleSkip() {
    if (canSkip) {
      beginExit();
    }
  }

  return (
    <motion.div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-soil outline-none"
      role="button"
      tabIndex={0}
      aria-label={t("intro.skipAria")}
      onClick={handleSkip}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleSkip();
        }
      }}
      animate={
        isExiting
          ? { opacity: 0, scale: prefersReducedMotion ? 1 : EXIT_ZOOM_SCALE }
          : { opacity: 1, scale: 1 }
      }
      transition={{ duration: EXIT_SECONDS, ease: "easeIn" }}
      onAnimationComplete={() => {
        if (isExiting) {
          onComplete();
        }
      }}
    >
      <TriangleDotStrip reduceMotion={prefersReducedMotion} />

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* The source asset's baked-in tagline is dark text with no way to
              recolor it, so we crop it off (it occupies the bottom ~8.5% of
              the image, rows 730-798 of 798px) and render our own tagline
              text below instead, in a color we control. */}
          <div className="aspect-[765/730] w-48 overflow-hidden sm:w-64">
            <Image src={logo} alt={t("intro.logoAlt")} priority className="h-full w-full object-cover object-top select-none" />
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-center text-sm text-parchment sm:text-base"
        >
          {t("intro.tagline")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          className="mt-2"
        >
          <IntroLoadingIndicator reduceMotion={prefersReducedMotion} />
        </motion.div>
      </div>

      <TriangleDotStrip reduceMotion={prefersReducedMotion} />
    </motion.div>
  );
}

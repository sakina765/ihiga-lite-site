"use client";

import { motion } from "motion/react";
import { usePrefersReducedMotion } from "../intro/usePrefersReducedMotion";

/**
 * Fade-in + slide-up when a section scrolls into view, matching the
 * animation language already used on /chat and the intro splash. Renders a
 * plain, unanimated div under prefers-reduced-motion rather than just
 * shortening the transition — respecting the setting means no motion, not
 * less motion.
 */
export function ScrollReveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

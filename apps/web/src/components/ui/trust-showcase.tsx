"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { cn } from "../../lib/utils";
import { usePrefersReducedMotion } from "../intro/usePrefersReducedMotion";

interface ShowcaseImage {
  src: string;
  alt: string;
}

interface TrustShowcaseProps {
  images: ShowcaseImage[];
  badgeText?: string;
  title: ReactNode;
  description: ReactNode;
  ctaText?: string;
  ctaHref?: string;
  className?: string;
}

// Hand-placed positions replicating a scattered photo-collage layout around
// the central message — responsive, with a lighter set on mobile so small
// screens don't get crowded. Sized so the biggest photos frame the corners
// and the message stays the clear focal point.
const IMAGE_POSITIONS = [
  { top: "4%", left: "13%", className: "hidden lg:block w-24 h-24" },
  { top: "14%", left: "34%", className: "hidden md:block w-20 h-20" },
  { top: "6%", left: "55%", className: "hidden md:block w-16 h-16" },
  { top: "9%", right: "14%", className: "hidden lg:block w-28 h-28" },
  { top: "26%", right: "4%", className: "hidden md:block w-20 h-20" },
  { top: "46%", right: "9%", className: "hidden lg:block w-24 h-24" },
  { top: "50%", left: "4%", className: "hidden md:block w-28 h-28" },
  { bottom: "6%", left: "19%", className: "hidden lg:block w-20 h-20" },
  { bottom: "16%", left: "44%", className: "hidden md:block w-16 h-16" },
  { bottom: "11%", right: "29%", className: "hidden md:block w-24 h-24" },
  { bottom: "3%", right: "14%", className: "hidden lg:block w-20 h-20" },
  { top: "9%", left: "6%", className: "block md:hidden w-16 h-16" },
  { top: "5%", right: "9%", className: "block md:hidden w-20 h-20" },
  { bottom: "6%", left: "9%", className: "block md:hidden w-20 h-20" },
  { bottom: "9%", right: "6%", className: "block md:hidden w-16 h-16" },
];

function FloatingImage({ image, index, reduceMotion }: { image: ShowcaseImage; index: number; reduceMotion: boolean }) {
  const position = IMAGE_POSITIONS[index];
  // A deterministic stagger reads as a deliberate, professional reveal —
  // unlike a shared Math.random() computed once at module load (an easy
  // mistake here, since a plain object literal only evaluates that once for
  // every instance, not per-image), this genuinely varies image to image.
  const enterDelay = (index % IMAGE_POSITIONS.length) * 0.06;
  // Independent per-image float duration/offset, computed fresh on each
  // render — small organic variation so the photos don't bob in lockstep.
  const floatDuration = reduceMotion ? 0 : 5 + ((index * 37) % 100) / 25;
  const floatDistance = reduceMotion ? 0 : 8 + ((index * 53) % 100) / 10;

  return (
    <motion.div
      // A consistent white mat behind every photo — some source photos are
      // already shot on a white studio backdrop and others aren't, which
      // read as inconsistent floating directly on a colored section
      // background. A uniform white card frame around each one fixes that.
      className={cn("absolute rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/5", position.className)}
      style={{ top: position.top, left: position.left, right: position.right, bottom: position.bottom }}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: enterDelay }}
      whileHover={{ scale: 1.1, zIndex: 20 }}
    >
      <motion.img
        src={image.src}
        alt={image.alt}
        className="h-full w-full rounded-lg object-cover"
        animate={reduceMotion ? undefined : { y: [0, -floatDistance, 0] }}
        transition={reduceMotion ? undefined : { duration: floatDuration, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
    </motion.div>
  );
}

/**
 * A scattered photo collage floating around a central trust statement —
 * adapted for Ihiga's "grounded in real, local data" message rather than a
 * literal testimonials wall. Swap `images` for real farmer/crop photos
 * whenever they're available; these are Unsplash placeholders.
 */
export function TrustShowcase({ images, badgeText, title, description, ctaText, ctaHref, className }: TrustShowcaseProps) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    // Background color lives on this full-width outer section — NOT on the
    // max-w-7xl content wrapper below. Putting bg + max-w on the same
    // element (the original bug here) means the color only paints the
    // centered content box; on any viewport wider than that, the page's
    // actual background shows as bands on either side instead.
    <section className={cn("w-full", className)}>
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:py-32">
        {images.slice(0, IMAGE_POSITIONS.length).map((image, index) => (
          // Index, not src, as the key — the same photo is deliberately reused
          // across a couple of the mutually-exclusive desktop/mobile position
          // slots (see TRUST_SHOWCASE_IMAGES), so src alone isn't unique.
          <FloatingImage key={index} image={image} index={index} reduceMotion={reduceMotion} />
        ))}

        {/*
          A solid backdrop "island" behind the message, not just z-10 — the
          floating photos are positioned by fixed percentages, so at some
          viewport widths (and with longer French/Kinyarwanda text) they'd
          otherwise drift close enough to overlap and obscure the actual
          readable content. This guarantees legibility regardless of viewport
          or language length, rather than hand-tuning positions per breakpoint.
        */}
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center rounded-3xl bg-white px-6 py-10 text-center shadow-2xl sm:px-12 sm:py-14">
          {badgeText && (
            <div className="mb-4 inline-block rounded-full border border-sage/30 bg-sage/10 px-3 py-1 text-sm font-semibold text-sage-dark">
              {badgeText}
            </div>
          )}
          <h2 className="mb-4 max-w-3xl text-4xl font-bold tracking-tight text-ink md:text-5xl">{title}</h2>
          <p className="mb-8 max-w-xl text-lg text-ink-soft">{description}</p>
          {ctaText && ctaHref && (
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-full bg-sage px-7 py-3 text-base font-semibold text-parchment transition-colors hover:bg-sage-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
            >
              {ctaText}
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

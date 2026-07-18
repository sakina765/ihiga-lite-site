"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
} from "motion/react";
import { cn } from "@/lib/utils";

// Same wrap(min, max, v) implementation @motionone/utils ships — inlined so
// this component doesn't need a second animation-adjacent dependency for one
// function, on top of the `motion` package this project already uses.
function wrap(min: number, max: number, v: number): number {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

type MarqueeAnimationProps = {
  children: string;
  className?: string;
  direction?: "left" | "right";
  baseVelocity: number;
};

// Layout only — no typographic defaults (size/weight/case) baked in, since
// there's no tailwind-merge here to let a caller's className override them.
// Callers own the type styling entirely via `className`.
function MarqueeAnimation({ children, className, direction = "left", baseVelocity = 10 }: MarqueeAnimationProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 0], {
    clamp: false,
  });

  const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`);

  const directionFactor = useRef<number>(1);
  useAnimationFrame((_t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    if (direction === "left") {
      directionFactor.current = 1;
    } else if (direction === "right") {
      directionFactor.current = -1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();

    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="relative flex max-w-[100vw] flex-nowrap overflow-hidden text-nowrap">
      <motion.div className={cn("flex flex-nowrap text-nowrap *:me-10 *:block", className)} style={{ x }}>
        <span>{children}</span>
        <span>{children}</span>
        <span>{children}</span>
        <span>{children}</span>
      </motion.div>
    </div>
  );
}

export { MarqueeAnimation };

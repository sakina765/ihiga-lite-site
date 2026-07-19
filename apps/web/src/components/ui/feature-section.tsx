"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { cn } from "../../lib/utils";
import { usePrefersReducedMotion } from "../intro/usePrefersReducedMotion";

interface Feature {
  step: string;
  title?: string;
  content: string;
  image: string;
}

interface FeatureStepsProps {
  features: Feature[];
  className?: string;
  title?: string;
  autoPlayInterval?: number;
  imageHeight?: string;
}

export function FeatureSteps({
  features,
  className,
  title = "How to get Started",
  autoPlayInterval = 3000,
  imageHeight = "h-[200px] md:h-[300px] lg:h-[400px]",
}: FeatureStepsProps) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [progress, setProgress] = useState(0);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => {
      if (progress < 100) {
        setProgress((prev) => prev + 100 / (autoPlayInterval / 100));
      } else {
        setCurrentFeature((prev) => (prev + 1) % features.length);
        setProgress(0);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [progress, features.length, autoPlayInterval]);

  return (
    <div className={cn("p-8 md:p-12", className)}>
      <div className="mx-auto w-full max-w-7xl">
        <h2 className="mb-10 text-center text-4xl font-bold tracking-tight text-ink md:text-5xl">{title}</h2>

        <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-10">
          <div className="order-2 space-y-8 md:order-1">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-6 md:gap-8"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: index === currentFeature ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 md:h-10 md:w-10",
                    index === currentFeature
                      ? "scale-110 border-sage bg-sage text-parchment"
                      : "border-ink-faint bg-parchment-3",
                  )}
                >
                  {index <= currentFeature ? (
                    <span className="text-lg font-bold">✓</span>
                  ) : (
                    <span className="text-lg font-semibold">{index + 1}</span>
                  )}
                </motion.div>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-ink md:text-2xl">{feature.title || feature.step}</h3>
                  <p className="text-sm text-ink-soft md:text-lg">{feature.content}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className={cn("relative order-1 overflow-hidden rounded-lg md:order-2", imageHeight)}>
            <AnimatePresence mode="wait">
              {features.map(
                (feature, index) =>
                  index === currentFeature && (
                    <motion.div
                      key={index}
                      className="absolute inset-0 overflow-hidden rounded-lg"
                      initial={reduceMotion ? { opacity: 0 } : { y: 100, opacity: 0, rotateX: -20 }}
                      animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1, rotateX: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { y: -100, opacity: 0, rotateX: 20 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                      <Image
                        src={feature.image}
                        alt={feature.title || feature.step}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-parchment-3 via-parchment-3/50 to-transparent" />
                    </motion.div>
                  ),
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

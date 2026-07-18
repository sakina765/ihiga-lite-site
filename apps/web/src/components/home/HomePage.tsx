"use client";

import Image from "next/image";
import Link from "next/link";
import heroBg from "../../app/herobg.jpg";
import logo from "../../app/Ihiga3d.png";
import { LineIcon, type LineIconName } from "../icons/lineIcons";
import { usePrefersReducedMotion } from "../intro/usePrefersReducedMotion";
import { MarqueeAnimation } from "../ui/marquee-effect";
import { ScrollReveal } from "./ScrollReveal";

const REPO_URL = "https://github.com/sakina765/ihiga-lite-site";

const PROBLEM_TEXT =
  "💡Rwandan farmers often get generic advice that doesn't match their specific crop, its current growth stage, or today's actual weather — and when a planting window or a rain risk is real, generic isn't enough.";

const FEATURES: Array<{ icon: LineIconName; title: string; description: string }> = [
  {
    icon: "cloudRain",
    title: "Season & Weather-Aware",
    description: "Advice grounded in real-time local weather and Rwanda's actual planting seasons.",
  },
  {
    icon: "plantStages",
    title: "Tracks Your Crop's Stage",
    description: "Knows what week you're in, from planting to harvest.",
  },
  {
    icon: "chatBubble",
    title: "Speaks Your Language",
    description: "English, Kinyarwanda, and French.",
  },
  {
    icon: "microphone",
    title: "Talk or Type",
    description: "Voice input for hands-free questions in the field.",
  },
  {
    icon: "camera",
    title: "Snap a Photo",
    description: "Visual guidance on what you're seeing in your crop.",
  },
  {
    icon: "phone",
    title: "Proactive Alerts",
    description: "SMS notifications when your crop or the weather needs your attention.",
  },
];

const STEPS = [
  "Tell Ihiga your crop and planting date.",
  "Ask anything — by text, voice, or photo.",
  "Get grounded, honest advice — Ihiga says “I don't know” rather than guessing.",
];

function FeatureCard({ icon, title, description, delay }: { icon: LineIconName; title: string; description: string; delay: number }) {
  return (
    <ScrollReveal delay={delay} className="rounded-2xl border border-parchment-2 bg-white p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-parchment-3 text-sage-dark">
        <LineIcon name={icon} size={26} strokeWidth={1.6} />
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{description}</p>
    </ScrollReveal>
  );
}

export function HomePage() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <main>
      {/* 1. Hero */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-28">
        <Image src={heroBg} alt="" fill priority sizes="100vw" className="object-cover" />
        {/* Soil-tinted overlay over the photo — keeps the brand color and text
            contrast while still letting the real photo read through. */}
        <div className="absolute inset-0 bg-soil/80" />
        <ScrollReveal className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
          <div className="aspect-[765/730] w-40 overflow-hidden sm:w-52">
            <Image src={logo} alt="Ihiga Lite" priority className="h-full w-full object-cover object-top select-none" />
          </div>
          <p className="mt-3 text-base text-parchment sm:text-lg">AI Insights for Better Farming</p>
          <Link
            href="/chat"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-sage px-7 py-3 text-base font-semibold text-parchment transition-colors hover:bg-sage-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
          >
            Start chatting with Ihiga
            <span aria-hidden="true">→</span>
          </Link>
        </ScrollReveal>
      </section>

      {/* 2. The problem */}
      <section className="overflow-hidden bg-sage-dark">
        {prefersReducedMotion ? (
          <p className="px-6 text-center text-2xl font-bold uppercase text-parchment sm:text-3xl">{PROBLEM_TEXT}</p>
        ) : (
          <div>
            <p className="sr-only">{PROBLEM_TEXT}</p>
            <div aria-hidden="true">
              <MarqueeAnimation
                direction="left"
                baseVelocity={-0.5}
                className="bg-sage-dark py-2 text-2xl font-bold uppercase text-parchment sm:text-3xl lg:text-5xl"
              >
                {PROBLEM_TEXT}
              </MarqueeAnimation>
            </div>
          </div>
        )}
      </section>

      {/* 3. Feature grid */}
      <section className="bg-parchment-3 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <h2 className="text-center text-2xl font-semibold text-ink sm:text-3xl">What Ihiga does</h2>
          </ScrollReveal>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} delay={Math.min(i, 3) * 0.08} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. How it works */}
      <section className="bg-parchment px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal>
            <h2 className="text-center text-2xl font-semibold text-ink sm:text-3xl">How it works</h2>
          </ScrollReveal>
          <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step} delay={i * 0.1} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-dark text-base font-semibold text-parchment">
                  {i + 1}
                </span>
                <p className="mt-3 text-sm text-ink-soft sm:text-base">{step}</p>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. Trust line */}
      <section className="bg-soil-deep px-6 py-12">
        <ScrollReveal className="mx-auto max-w-xl text-center">
          <p className="text-sm text-leaf sm:text-base">
            Ihiga&apos;s advice is grounded in validated Rwandan crop and season guidance, not general assumptions.
          </p>
        </ScrollReveal>
      </section>

      {/* 6. Footer */}
      <footer className="bg-soil px-6 py-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <p className="text-xs text-leaf sm:text-sm">Ihiga chats in English, Kinyarwanda (RW), and French (FR) — just start typing in whichever you prefer.</p>
          <div className="flex items-center gap-4 text-xs text-parchment/70 sm:text-sm">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:text-parchment hover:underline"
            >
              GitHub
            </a>
            <span aria-hidden="true">·</span>
            <span>© 2026 Ihiga Lite</span>
          </div>
          <p className="text-[11px] text-parchment/50">Built with Next.js, NestJS, and Groq.</p>
        </div>
      </footer>
    </main>
  );
}

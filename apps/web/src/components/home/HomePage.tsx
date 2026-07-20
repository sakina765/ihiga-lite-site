"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import heroBg from "../../app/herobg.jpg";
import heroBg2 from "../../app/herobg2.jpg";
import heroBg3 from "../../app/herobg3.jpg";
import heroBg4 from "../../app/herobg4.jpg";
import logo from "../../app/Ihiga3d.png";
import logoIcon from "../../app/IhigaIcon.png";
import { LineIcon, type LineIconName } from "../icons/lineIcons";
import { SocialIcon, type SocialIconName } from "../icons/socialIcons";
import { usePrefersReducedMotion } from "../intro/usePrefersReducedMotion";
import { MarqueeAnimation } from "../ui/marquee-effect";
import { FeatureSteps } from "../ui/feature-section";
import { TrustShowcase } from "../ui/trust-showcase";
import { FloatingMascot } from "./FloatingMascot";
import { HeroBackgroundSlider } from "./HeroBackgroundSlider";
import { ScrollReveal } from "./ScrollReveal";
import { useLanguage } from "../../i18n/LanguageProvider";
import { LanguageSwitcher } from "../../i18n/LanguageSwitcher";

const REPO_URL = "https://github.com/sakina765/ihiga-lite-site";

// GitHub is the only one that actually goes anywhere right now — the rest
// are placeholders until real accounts exist, per how the trust-section
// photos were handled too (shipped now, swapped in later).
const SOCIAL_LINKS: Array<{ name: SocialIconName; href: string | null }> = [
  { name: "github", href: REPO_URL },
  { name: "instagram", href: null },
  { name: "linkedin", href: null },
  { name: "twitter", href: null },
  { name: "facebook", href: null },
];

const FEATURE_KEYS: Array<{ icon: LineIconName; key: string }> = [
  { icon: "cloudRain", key: "weather" },
  { icon: "plantStages", key: "stage" },
  { icon: "chatBubble", key: "language" },
  { icon: "microphone", key: "talk" },
  { icon: "camera", key: "photo" },
  { icon: "phone", key: "alerts" },
];

// Placeholder photos for the "How it works" animated feature section —
// random-but-related Unsplash stock shots, swap for real photos later.
const HOW_IT_WORKS_KEYS = [
  { key: "step1", image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop" },
  { key: "step2", image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=2070&auto=format&fit=crop" },
  { key: "step3", image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2070&auto=format&fit=crop" },
];

// Placeholder photo collage for the trust section — random-but-related
// Unsplash farm/crop shots, swap for real photos later.
const TRUST_SHOWCASE_IMAGES = [
  { src: "https://images.unsplash.com/photo-1590682680695-43b964a3ae17?q=80&w=300&auto=format&fit=crop", alt: "Hands planting a seedling" },
  { src: "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?q=80&w=300&auto=format&fit=crop", alt: "Crop rows across green hills" },
  { src: "https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=300&auto=format&fit=crop", alt: "Tomatoes ripening on the vine" },
  { src: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=300&auto=format&fit=crop", alt: "Seedlings in a tray" },
  { src: "https://images.unsplash.com/photo-1445282768818-728615cc910a?q=80&w=300&auto=format&fit=crop", alt: "Freshly harvested carrots" },
  { src: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?q=80&w=300&auto=format&fit=crop", alt: "Assorted fresh vegetables" },
  { src: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?q=80&w=300&auto=format&fit=crop", alt: "A thriving vegetable garden bed" },
  { src: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=300&auto=format&fit=crop", alt: "Sunrise over a wheat field" },
  { src: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=300&auto=format&fit=crop", alt: "A trowel scooping soil" },
  { src: "https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=300&auto=format&fit=crop", alt: "Rows of crops across a field" },
  { src: "https://images.unsplash.com/photo-1595855759920-86582396756a?q=80&w=300&auto=format&fit=crop", alt: "Fresh asparagus" },
  { src: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=300&auto=format&fit=crop", alt: "Cattle grazing at sunset" },
  { src: "https://images.unsplash.com/photo-1587049633312-d628ae50a8ae?q=80&w=300&auto=format&fit=crop", alt: "Freshly picked onions" },
  { src: "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?q=80&w=300&auto=format&fit=crop", alt: "Baskets of freshly picked strawberries" },
  { src: "https://images.unsplash.com/photo-1590682680695-43b964a3ae17?q=80&w=300&auto=format&fit=crop", alt: "Hands planting a seedling" },
];

function FeatureCard({ icon, title, description, delay }: { icon: LineIconName; title: string; description: string; delay: number }) {
  return (
    <ScrollReveal delay={delay}>
      {/* A separate plain div for the hover styling, not ScrollReveal's own
          wrapper — ScrollReveal's motion.div permanently controls `transform`
          via inline style (for its entrance fade/slide-up), and an inline
          style always beats a CSS `:hover` class targeting the same
          property, so a hover:-translate-y here would silently never fire. */}
      <div className="group rounded-2xl border border-parchment-2 bg-white p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-sage hover:shadow-xl hover:shadow-sage/10">
        <motion.div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-parchment-3 text-sage-dark transition-colors duration-300 group-hover:bg-sage group-hover:text-parchment"
          whileHover={{ scale: 1.15, rotate: 8 }}
          transition={{ type: "spring", stiffness: 300, damping: 12 }}
        >
          <LineIcon name={icon} size={26} strokeWidth={1.6} />
        </motion.div>
        <h3 className="text-base font-semibold text-ink transition-colors duration-300 group-hover:text-sage-dark">{title}</h3>
        <p className="mt-1 text-sm text-ink-soft">{description}</p>
      </div>
    </ScrollReveal>
  );
}

export function HomePage() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { t } = useLanguage();
  const problemText = t("home.problem.text");

  return (
    <main>
      {/* 1. Hero */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-28">
        <HeroBackgroundSlider images={[heroBg, heroBg2, heroBg3, heroBg4]} />
        {/* Soil-tinted overlay over the photo — keeps the brand color and text
            contrast while still letting the real photo read through. */}
        <div className="absolute inset-0 bg-soil/80" />
        <LanguageSwitcher className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6" />
        <ScrollReveal className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
          <div className="aspect-[765/730] w-40 overflow-hidden sm:w-52">
            <Image src={logo} alt={t("home.logoAlt")} priority className="h-full w-full object-cover object-top select-none" />
          </div>
          <p className="mt-3 text-base text-parchment sm:text-lg">{t("home.hero.tagline")}</p>
          <Link
            href="/chat"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-sage px-7 py-3 text-base font-semibold text-parchment transition-colors hover:bg-sage-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
          >
            {t("home.hero.cta")}
            <span aria-hidden="true">→</span>
          </Link>
        </ScrollReveal>
      </section>

      {/* 2. The problem */}
      <section className="overflow-hidden bg-sage-dark">
        {prefersReducedMotion ? (
          <p className="px-6 text-center text-2xl font-bold uppercase text-parchment sm:text-3xl">{problemText}</p>
        ) : (
          <div>
            <p className="sr-only">{problemText}</p>
            <div aria-hidden="true">
              <MarqueeAnimation
                direction="left"
                baseVelocity={-0.2}
                className="bg-sage-dark py-2 text-2xl font-bold uppercase text-parchment sm:text-3xl lg:text-5xl"
              >
                {problemText}
              </MarqueeAnimation>
            </div>
          </div>
        )}
      </section>

      {/* 3. Feature grid */}
      <section className="bg-parchment-3 px-6 py-16">
        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[220px_1fr] lg:items-center lg:gap-12">
          <ScrollReveal className="mb-10 lg:mb-0">
            <FloatingMascot />
          </ScrollReveal>
          <div>
            <ScrollReveal>
              <h2 className="text-center text-4xl font-bold tracking-tight text-ink md:text-5xl lg:text-left">{t("home.features.heading")}</h2>
            </ScrollReveal>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {FEATURE_KEYS.map((feature, i) => (
                <FeatureCard
                  key={feature.key}
                  icon={feature.icon}
                  title={t(`home.features.${feature.key}.title`)}
                  description={t(`home.features.${feature.key}.description`)}
                  delay={Math.min(i, 3) * 0.08}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. How it works */}
      <section className="bg-parchment-3">
        <FeatureSteps
          title={t("home.howItWorks.heading")}
          autoPlayInterval={4000}
          features={HOW_IT_WORKS_KEYS.map(({ key, image }) => ({
            step: key,
            title: t(`home.howItWorks.${key}Title`),
            content: t(`home.howItWorks.${key}`),
            image,
          }))}
        />
      </section>

      {/* 5. Trust showcase */}
      <TrustShowcase
        className="bg-parchment-3"
        images={TRUST_SHOWCASE_IMAGES}
        badgeText={t("home.trust.badge")}
        title={
          <>
            {t("home.trust.titleLine1")}
            <br />
            {t("home.trust.titleLine2")}
          </>
        }
        description={t("home.trust.text")}
        ctaText={t("home.hero.cta")}
        ctaHref="/chat"
      />

      {/* 6. Footer */}
      <footer className="border-t border-parchment/10 bg-soil px-6 pb-10 pt-12">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-1">
            <div className="h-8 aspect-[662/520]">
              <Image src={logoIcon} alt="" className="h-full w-full object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight text-parchment">{t("home.logoAlt")}</span>
          </div>

          <LanguageSwitcher />

          <p className="text-xs text-leaf sm:text-sm">{t("home.footer.copyright")}</p>

          <div className="flex items-center gap-6">
            {SOCIAL_LINKS.map(({ name, href }) =>
              href ? (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("home.footer.github")}
                  className="text-parchment/70 transition-all duration-200 hover:scale-110 hover:text-parchment"
                >
                  <SocialIcon name={name} />
                </a>
              ) : (
                // Not linked anywhere yet — real accounts don't exist yet, dimmed
                // relative to GitHub so it doesn't read as equally interactive.
                <span key={name} aria-hidden="true" className="text-parchment/30">
                  <SocialIcon name={name} />
                </span>
              ),
            )}
          </div>
        </div>
      </footer>
    </main>
  );
}

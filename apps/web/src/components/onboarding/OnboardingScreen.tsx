"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import type { Sector } from "@ihiga-lite/shared";
import logo from "../../app/Ihiga3d.png";
import { registerFarmer } from "../../lib/farmers-api";
import { getNearestSector, getSectors } from "../../lib/location-api";
import { RWANDA_PROVINCE_DISTRICTS, districtToProvince } from "../../lib/rwanda-locations";

const PROVINCES = Object.keys(RWANDA_PROVINCE_DISTRICTS);

type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";

export function OnboardingScreen({ onRegistered }: { onRegistered: (farmerId: string) => void }) {
  const [phoneNumber, setPhoneNumber] = useState("");

  // Cascading picker state — province -> district -> sector -> optional village text.
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [villageText, setVillageText] = useState("");
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [sectorsLoading, setSectorsLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Raw GPS reading (kept separate from the picker's sector/village choice —
  // sent as-is to registration's latitude/longitude fields regardless of
  // what the farmer ends up picking, per farmer.entity.ts's farmLatitude doc).
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [gpsAutoFilled, setGpsAutoFilled] = useState(false);

  // Fetches the sector dropdown's options whenever the district changes —
  // never on every keystroke, only on this one state transition. Cancelled
  // guard mirrors useSidebarData's pattern so a stale, slower request for a
  // since-abandoned district can't clobber a newer one's results.
  useEffect(() => {
    if (!district) {
      setSectors([]);
      return;
    }
    let cancelled = false;
    setSectorsLoading(true);
    getSectors(district)
      .then((data) => !cancelled && setSectors(data))
      .catch(() => !cancelled && setSectors([]))
      .finally(() => !cancelled && setSectorsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [district]);

  function handleProvinceChange(nextProvince: string) {
    setGpsAutoFilled(false);
    setProvince(nextProvince);
    setDistrict("");
    setSectorId("");
    setVillageText("");
  }

  function handleDistrictChange(nextDistrict: string) {
    setGpsAutoFilled(false);
    setDistrict(nextDistrict);
    setSectorId("");
    setVillageText("");
  }

  function handleSectorChange(nextSectorId: string) {
    setGpsAutoFilled(false);
    setSectorId(nextSectorId);
  }

  // Only ever runs on an explicit tap, never on mount — the geolocation
  // permission prompt should never appear before a farmer asks for it, and
  // this must never block or delay the existing phone+picker flow.
  function handleShareLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        setLocationStatus("granted");

        // Reverse-resolve to the closest seeded sector and pre-fill the
        // cascade — the farmer can still review/correct this before
        // confirming, rather than GPS silently overriding their choice.
        try {
          const nearest = await getNearestSector(latitude, longitude);
          if (nearest) {
            setProvince(districtToProvince(nearest.district) ?? "");
            setDistrict(nearest.district);
            setSectors([nearest]);
            setSectorId(nearest.id);
            setGpsAutoFilled(true);
          }
        } catch {
          // GPS reading itself still succeeded and will still be sent as
          // latitude/longitude below — only the auto-fill convenience is lost.
        }
      },
      () => setLocationStatus("denied"),
      { timeout: 8000 },
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!phoneNumber.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await registerFarmer({
        phoneNumber: phoneNumber.trim(),
        district: district || undefined,
        sectorId: sectorId || undefined,
        villageText: villageText.trim() || undefined,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
      onRegistered(response.farmerId);
    } catch {
      setError("That phone number doesn't look right — try the format 07XX XXX XXX.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const districtOptions = province ? (RWANDA_PROVINCE_DISTRICTS[province] ?? []) : [];

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-parchment-2 px-4 sm:bg-soil-deep">
      {/* Huge, low-opacity watermark of the real logo, centered behind the
          card — purely decorative (empty alt, aria-hidden, pointer-events-none).
          Higher opacity below sm: against the light bg-parchment-2 background
          there, a green logo at 10% measured at only a ~6-point pixel
          difference from the background — effectively invisible. The dark
          sm:bg-soil-deep background gives enough contrast at 10% on its own. */}
      <Image
        src={logo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-auto w-[140vmin] max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-20 sm:opacity-10"
      />
      {/*
        Real "liquid glass" (Apple's iOS 26 design language, and the
        photoreal glass mockup this was compared against) isn't just blur +
        translucency — it's actual refractive distortion of what's behind the
        glass, produced via an SVG feTurbulence -> feDisplacementMap chain fed
        into backdrop-filter, plus a specular-highlight rim that "catches
        light" on the edge. Plain backdrop-blur (what was here before) is the
        common web approximation, but it's flat — nothing behind it actually
        bends.

        Real constraint, not a stylistic choice: only Chromium browsers
        currently support an SVG filter (url(#id)) as a backdrop-filter input;
        Safari/Firefox restrict backdrop-filter to built-in CSS filter
        functions. So the distortion is applied as a progressive enhancement
        via @supports — Chromium gets genuine refraction, everything else
        falls back to the plain blur+saturate that already works everywhere.
      */}
      <svg aria-hidden="true" className="absolute h-0 w-0">
        <filter id="ihiga-glass-distortion" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="2" result="softNoise" />
          <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="70" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <style>{`
        .ihiga-liquid-glass {
          backdrop-filter: blur(28px) saturate(1.5);
          -webkit-backdrop-filter: blur(28px) saturate(1.5);
        }
        @supports (backdrop-filter: url(#ihiga-glass-distortion)) {
          .ihiga-liquid-glass {
            backdrop-filter: url(#ihiga-glass-distortion) blur(6px) saturate(1.6);
          }
        }
      `}</style>
      {/* Gradient-tinted translucent white — lighter than the first pass
          (was 80%/60%, measured to make the refraction underneath
          imperceptible: verified in an isolated test page that the
          feDisplacementMap warp is real and dramatic against a
          high-contrast background, but nearly invisible once layered under
          a mostly-opaque tint + sheen on top of an already-smooth, low-
          contrast background). Lowered until the warp actually reads, then
          re-verified contrast numerically (see report) rather than assuming
          it still passes at the new opacity. */}
      <div className="ihiga-liquid-glass relative z-10 w-full max-w-[360px] rounded-3xl border border-white/50 bg-gradient-to-b from-white/55 to-white/30 p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35),inset_1px_1px_0_0_rgba(255,255,255,0.7),inset_-1px_-1px_0_0_rgba(0,0,0,0.06)]">
        {/* Diagonal sheen — the soft bright streak a curved glass surface
            catches from a light source, sitting between the glass tint and
            the actual content (z-10 below). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/35 via-transparent to-transparent"
        />
        <div className="relative z-10 mb-6 flex flex-col items-center text-center">
          {/* Same crop trick used in IntroSplash/the homepage hero — the
              source PNG's baked-in tagline (bottom ~8.5%) can't be recolored,
              so it's cropped off and this screen's own tagline text is used instead. */}
          <div className="mb-3 aspect-[765/730] w-16 overflow-hidden">
            <Image src={logo} alt="Ihiga Lite" priority className="h-full w-full object-cover object-top select-none" />
          </div>
          <h1 className="text-lg font-semibold text-ink">Welcome to Ihiga</h1>
          <p className="mt-1 text-sm text-ink-soft">Your crop advisory assistant. Let&apos;s get you set up.</p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Phone number</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="e.g. 0788 123 456"
              autoComplete="tel"
              className="rounded-xl border border-white/60 bg-white/50 px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </label>

          {/* GPS shortcut — a fast path ABOVE the cascading picker, not a
              replacement for it. Auto-fills the picker below on success, but
              the farmer always sees (and can correct) the result before
              submitting. */}
          {locationStatus === "unsupported" ? null : (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={handleShareLocation}
                disabled={locationStatus === "requesting"}
                className="rounded-xl border border-white/60 bg-white/50 px-3 py-2 text-sm font-medium text-ink-soft backdrop-blur-sm transition-colors hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {locationStatus === "requesting" ? "Getting your location…" : "Use my current GPS location"}
              </button>
              {locationStatus === "granted" && gpsAutoFilled && (
                <span className="text-xs text-sage-dark">Location shared ✓ — auto-filled below, review before continuing.</span>
              )}
              {locationStatus === "granted" && !gpsAutoFilled && (
                <span className="text-xs text-ink-faint">Location shared ✓ — pick your area below to see local weather.</span>
              )}
              {locationStatus === "denied" && (
                <span className="text-xs text-ink-faint">Couldn&apos;t get your location — you can pick your area below instead.</span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-xl border border-white/50 bg-white/30 p-3 backdrop-blur-sm">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Province (optional)</span>
              <select
                value={province}
                onChange={(event) => handleProvinceChange(event.target.value)}
                className="rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage"
              >
                <option value="">Skip for now</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            {province && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">District</span>
                <select
                  value={district}
                  onChange={(event) => handleDistrictChange(event.target.value)}
                  className="rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage"
                >
                  <option value="">Skip for now</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {district && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">Sector</span>
                <select
                  value={sectorId}
                  onChange={(event) => handleSectorChange(event.target.value)}
                  disabled={sectorsLoading}
                  className="rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">{sectorsLoading ? "Loading sectors…" : "Skip for now"}</option>
                  {sectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {sectorId && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">Village / cell (optional)</span>
                <input
                  type="text"
                  value={villageText}
                  onChange={(event) => setVillageText(event.target.value)}
                  placeholder="e.g. Kabuga"
                  className="rounded-xl border border-white/60 bg-white/50 px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sage"
                />
                <span className="text-xs text-ink-faint">
                  For the most precise weather. If we can&apos;t find it, we&apos;ll use your sector&apos;s weather instead.
                </span>
              </label>
            )}

            <span className="text-xs text-ink-faint">Used for local weather advice — you can add this later.</span>
          </div>

          {error && <p className="text-sm text-clay">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-full bg-sage px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-dark"
          >
            {isSubmitting ? "Starting…" : "Start chatting"}
          </button>
        </form>
      </div>
    </div>
  );
}

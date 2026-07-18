"use client";

import { useState, type FormEvent } from "react";
import { registerFarmer } from "../../lib/farmers-api";

// Matches apps/api/src/weather/rwanda-districts.ts — all 30 official districts
// plus "Kigali" as a convenience option for the city as a whole. Keep this
// list in sync if the backend list ever changes.
const DISTRICTS = [
  "Kigali",
  "Gasabo",
  "Kicukiro",
  "Nyarugenge",
  "Musanze",
  "Gicumbi",
  "Rulindo",
  "Burera",
  "Gakenke",
  "Huye",
  "Nyanza",
  "Gisagara",
  "Nyaruguru",
  "Muhanga",
  "Kamonyi",
  "Ruhango",
  "Nyamagabe",
  "Rwamagana",
  "Nyagatare",
  "Gatsibo",
  "Kayonza",
  "Kirehe",
  "Ngoma",
  "Bugesera",
  "Rubavu",
  "Rusizi",
  "Nyabihu",
  "Karongi",
  "Rutsiro",
  "Ngororero",
  "Nyamasheke",
];

type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";

export function OnboardingScreen({ onRegistered }: { onRegistered: (farmerId: string) => void }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [district, setDistrict] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");

  // Only ever runs on an explicit tap, never on mount — the geolocation
  // permission prompt should never appear before a farmer asks for it, and
  // this must never block or delay the existing phone+district flow.
  function handleShareLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationStatus("granted");
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

  return (
    <div className="flex min-h-dvh items-center justify-center bg-parchment-2 px-4 sm:bg-soil-deep">
      <div className="w-full max-w-[360px] rounded-3xl border border-parchment-2 bg-parchment p-6 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-2xl" aria-hidden="true">
            🌱
          </div>
          <h1 className="text-lg font-semibold text-ink">Welcome to Ihiga</h1>
          <p className="mt-1 text-sm text-ink-soft">Your crop advisory assistant. Let&apos;s get you set up.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Phone number</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="e.g. 0788 123 456"
              autoComplete="tel"
              className="rounded-xl border border-parchment-2 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-sage"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">District (optional)</span>
            <select
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              className="rounded-xl border border-parchment-2 bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage"
            >
              <option value="">Skip for now</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <span className="text-xs text-ink-faint">Used for local weather advice — you can add this later.</span>
          </label>

          {locationStatus === "granted" ? (
            <p className="text-xs text-sage-dark">Farm location shared ✓ — for even more precise weather.</p>
          ) : locationStatus === "unsupported" ? null : (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={handleShareLocation}
                disabled={locationStatus === "requesting"}
                className="rounded-xl border border-parchment-2 bg-white px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-parchment-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {locationStatus === "requesting" ? "Getting your location…" : "Share my farm location (optional)"}
              </button>
              {locationStatus === "denied" && (
                <span className="text-xs text-ink-faint">Couldn&apos;t get your location — you can skip this.</span>
              )}
            </div>
          )}

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

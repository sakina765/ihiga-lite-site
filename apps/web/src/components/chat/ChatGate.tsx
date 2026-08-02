"use client";

import { useEffect, useState } from "react";
import { OnboardingScreen } from "../onboarding/OnboardingScreen";
import { ChatWidget } from "./ChatWidget";
import { isFarmerDeactivated } from "../../lib/farmers-api";
import { useLanguage } from "../../i18n/LanguageProvider";

const STORAGE_KEY = "ihiga_farmer_id";

type GateStatus = "checking" | "onboarding" | "active" | "deactivated";

/**
 * Gates the chat UI behind farmer registration, and behind account status.
 * Deactivation used to only take effect once a farmer actually sent a
 * message (see ChatOrchestratorService.handleDeactivatedFarmerMessage's
 * canned reply) — opening /chat itself looked completely normal right up
 * until that point, which reads as "deactivation doesn't do anything" from
 * the outside. This checks status once on mount, before ChatWidget ever
 * renders, same "return null while unknown" pattern the gate already used
 * for the registration check.
 */
export function ChatGate() {
  const [status, setStatus] = useState<GateStatus>("checking");
  const [farmerId, setFarmerId] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (!storedId) {
      setStatus("onboarding");
      return;
    }
    setFarmerId(storedId);

    let cancelled = false;
    isFarmerDeactivated(storedId).then((deactivated) => {
      if (!cancelled) {
        setStatus(deactivated ? "deactivated" : "active");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // registerOrFind is idempotent BY PHONE NUMBER, not by account status: a
  // farmer whose account was deactivated, then clears localStorage (new
  // device, reinstall) and re-onboards with the SAME phone number, gets the
  // SAME deactivated farmerId handed back by POST /farmers/register — with
  // nothing in that response distinguishing it from a fresh registration.
  // Assuming "just registered" means "definitely active" would let
  // deactivation be silently bypassed just by re-onboarding, so this re-runs
  // the real status check instead of assuming the outcome.
  function handleRegistered(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    setFarmerId(id);
    setStatus("checking");
    isFarmerDeactivated(id).then((deactivated) => {
      setStatus(deactivated ? "deactivated" : "active");
    });
  }

  if (status === "checking") {
    return null;
  }

  if (status === "onboarding") {
    return <OnboardingScreen onRegistered={handleRegistered} />;
  }

  if (status === "deactivated") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-parchment-2 px-6">
        <div className="w-full max-w-sm rounded-2xl border border-soil/10 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-ink">{t("chat.deactivated.title")}</h1>
          <p className="mt-2 text-sm text-ink-soft">{t("chat.deactivated.body")}</p>
        </div>
      </div>
    );
  }

  return <ChatWidget farmerId={farmerId as string} />;
}

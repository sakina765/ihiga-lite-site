"use client";

import { useEffect, useState } from "react";
import { OnboardingScreen } from "../onboarding/OnboardingScreen";
import { ChatWidget } from "./ChatWidget";
import { isFarmerDeactivated } from "../../lib/farmers-api";

const STORAGE_KEY = "ihiga_farmer_id";
const CONVERSATION_STORAGE_KEY = "ihiga_conversation_id";

type GateStatus = "checking" | "onboarding" | "active";

/**
 * Gates the chat UI behind farmer registration, and behind account status.
 *
 * A deleted farmer's phoneNumber is permanently freed for reuse (see
 * FarmersService.deactivate) — there is no restore, so unlike an earlier
 * version of this gate, a deleted account is never a dead end shown to the
 * farmer. It's treated exactly like "never registered": the stale
 * farmerId/conversationId are cleared and they're dropped straight into
 * onboarding, where the same phone number (or a different one) just starts
 * a genuinely new, active account. Clearing the conversation id too matters
 * — otherwise ChatWidget would try to resume the OLD farmer's conversation,
 * which 404s once it belongs to a different farmerId (see the ownership
 * check shared across every conversationId-accepting endpoint).
 */
export function ChatGate() {
  const [status, setStatus] = useState<GateStatus>("checking");
  const [farmerId, setFarmerId] = useState<string | null>(null);

  function clearStaleFarmer() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CONVERSATION_STORAGE_KEY);
    setFarmerId(null);
    setStatus("onboarding");
  }

  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (!storedId) {
      setStatus("onboarding");
      return;
    }
    setFarmerId(storedId);

    let cancelled = false;
    isFarmerDeactivated(storedId).then((deactivated) => {
      if (cancelled) {
        return;
      }
      if (deactivated) {
        clearStaleFarmer();
      } else {
        setStatus("active");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleRegistered(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    setFarmerId(id);
    setStatus("checking");
    isFarmerDeactivated(id).then((deactivated) => {
      if (deactivated) {
        // Should be effectively unreachable now that deletion frees the
        // phone number (a fresh register() would create a new row instead
        // of finding this one) — kept as a safety net, not a dead end.
        clearStaleFarmer();
      } else {
        setStatus("active");
      }
    });
  }

  if (status === "checking") {
    return null;
  }

  if (status === "onboarding") {
    return <OnboardingScreen onRegistered={handleRegistered} />;
  }

  return <ChatWidget farmerId={farmerId as string} />;
}

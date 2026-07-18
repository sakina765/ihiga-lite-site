"use client";

import { useEffect, useState } from "react";
import { OnboardingScreen } from "../onboarding/OnboardingScreen";
import { ChatWidget } from "./ChatWidget";

const STORAGE_KEY = "ihiga_farmer_id";

/**
 * Gates the chat UI behind farmer registration. `undefined` = "haven't checked
 * localStorage yet" (avoids a flash of the onboarding screen for returning
 * visitors before the check runs); `null` = "checked, nothing stored".
 */
export function ChatGate() {
  const [farmerId, setFarmerId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    setFarmerId(localStorage.getItem(STORAGE_KEY));
  }, []);

  if (farmerId === undefined) {
    return null;
  }

  if (!farmerId) {
    return (
      <OnboardingScreen
        onRegistered={(id) => {
          localStorage.setItem(STORAGE_KEY, id);
          setFarmerId(id);
        }}
      />
    );
  }

  return <ChatWidget farmerId={farmerId} />;
}

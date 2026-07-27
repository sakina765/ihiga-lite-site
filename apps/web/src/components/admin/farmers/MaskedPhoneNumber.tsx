"use client";

import { useState } from "react";

/** Keeps the country/network prefix and last 4 digits, masks the rest — e.g. "+2507•••3456". */
function maskPhoneNumber(phone: string): string {
  if (phone.length <= 9) {
    return phone;
  }
  return `${phone.slice(0, 5)}•••${phone.slice(-4)}`;
}

/** Masked by default, consistent with the PII-conscious logging already in this codebase (see apps/api/src/common/pii.util.ts) — click reveals the real number for as long as an admin needs it. */
export function MaskedPhoneNumber({ phoneNumber }: { phoneNumber: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setRevealed((prev) => !prev)}
      title={revealed ? "Click to mask" : "Click to reveal"}
      className="font-mono text-sm text-ink underline decoration-dotted underline-offset-2 hover:text-sage-dark"
    >
      {revealed ? phoneNumber : maskPhoneNumber(phoneNumber)}
    </button>
  );
}

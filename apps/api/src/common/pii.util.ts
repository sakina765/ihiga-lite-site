/** Masks all but the last 4 characters — for logging a phone number without putting PII in plaintext logs. */
export function maskPhoneNumber(phone: string): string {
  if (phone.length <= 4) {
    return "*".repeat(phone.length);
  }
  return `${"*".repeat(phone.length - 4)}${phone.slice(-4)}`;
}

/**
 * Zeroes the last segment of an IP address (last octet for IPv4, last group
 * for IPv6) — enough to see which network a burst of rate-limited traffic
 * came from for tuning limits, without logging a single client's full
 * identifying address. Same "useful but not identifying" pattern as
 * maskPhoneNumber above. Falls back to fully masking anything that isn't
 * recognizably IPv4/IPv6 (e.g. a malformed or unknown tracker value).
 */
export function maskIpAddress(ip: string): string {
  const ipv4Mapped = ip.startsWith("::ffff:") ? ip.slice(7) : ip;

  const ipv4Parts = ipv4Mapped.split(".");
  if (ipv4Parts.length === 4 && ipv4Parts.every((part) => /^\d{1,3}$/.test(part))) {
    return `${ipv4Parts.slice(0, 3).join(".")}.0`;
  }

  const ipv6Parts = ip.split(":");
  if (ipv6Parts.length >= 3) {
    return `${ipv6Parts.slice(0, -1).join(":")}:0`;
  }

  return "*".repeat(ip.length);
}

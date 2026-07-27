"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminMe } from "../../lib/admin-api";

/**
 * Gates everything under app/admin/(protected) behind a real admin session.
 *
 * This deliberately can't be done in Next.js middleware (the usual place for
 * route-level auth gating in this codebase's farmer-facing CSP, see
 * middleware.ts) — the admin session cookie is set by AdminAuthController on
 * the API's own origin, not the frontend's, and is scoped to that origin by
 * the browser regardless of environment. Next's middleware runs on the
 * frontend's request and simply never sees it. A client-side check against
 * GET /admin/auth/me (which DOES send the cookie, via credentials: "include")
 * is the only place that can actually answer "is this session valid" —
 * mirrors ChatGate's localStorage-based check, just backed by a real
 * server-verified session instead of a client-held id.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "authorized" | "unauthorized">("checking");

  useEffect(() => {
    let cancelled = false;
    adminMe().then((me) => {
      if (cancelled) {
        return;
      }
      if (me) {
        setStatus("authorized");
      } else {
        setStatus("unauthorized");
        router.replace("/admin/login");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status !== "authorized") {
    // No flash of admin content before the check resolves, and no flash of
    // "redirecting" UI either — same "return null while unknown" pattern as
    // ChatGate.tsx.
    return null;
  }

  return <>{children}</>;
}

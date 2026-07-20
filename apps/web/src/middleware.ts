import { NextRequest, NextResponse } from "next/server";

/**
 * Content-Security-Policy lives here, not in next.config.js's headers(),
 * because it needs a fresh nonce on every single response. The App Router
 * streams its own inline <script> tags on every page (RSC hydration
 * payloads) — verified live: a static `script-src 'self'` blocks every one
 * of them with "Executing inline script violates ... script-src 'self'".
 * The fix isn't `'unsafe-inline'` (that would let ANY injected <script> tag
 * execute too, defeating the one thing CSP is best known for stopping) —
 * it's this exact pattern from Next.js's own CSP docs: a per-request nonce
 * plus 'strict-dynamic', which lets a nonce'd script load further scripts
 * (covering Next's own chunks) while still refusing anything an attacker's
 * XSS payload injects without that nonce.
 */
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isProduction = process.env.NODE_ENV === "production";

  // Read at request time (middleware runs server-side, not limited to
  // NEXT_PUBLIC_-prefixed vars for its own purposes) so connect-src allows
  // exactly the configured API origin instead of hardcoding one or
  // loosening the policy to allow any origin.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const apiOrigin = new URL(apiUrl).origin;

  const csp = [
    "default-src 'self'",
    // 'strict-dynamic' makes the plain 'self'/host allowlist irrelevant to
    // CSP3-aware browsers (a nonce'd script's own subresource loads are
    // trusted regardless), but is ignored by older browsers, which fall back
    // to trusting 'self' — both are listed for that reason, not redundancy.
    // 'unsafe-eval' is required only by `next dev`'s webpack HMR (which
    // wraps modules in eval() for better dev stack traces) — never present
    // in a production build, confirmed by testing both.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProduction ? "" : " 'unsafe-eval'"}`,
    // React/Motion set inline styles via the CSSOM style property
    // (element.style.x = ...), which isn't restricted by CSP the way a
    // literal style="..." markup attribute is — but this stays permissive
    // for style-src since Tailwind's arbitrary utility classes and any
    // future inline style="" usage would otherwise be a silent,
    // hard-to-diagnose breakage for a purely cosmetic risk (unlike script-src).
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com",
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Skip Next's own static asset/image-optimizer routes — no HTML is ever
    // served from them, so there's nothing to apply a per-request CSP to.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

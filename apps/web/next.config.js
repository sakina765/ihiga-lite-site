const isProduction = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ihiga-lite/shared"],
  images: {
    // Temporary Unsplash placeholders in the homepage's "How it works"
    // feature section — swap for real photos, then this can be removed.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  // Content-Security-Policy is set per-request in middleware.ts instead of
  // here — it needs a fresh nonce on every response (see middleware.ts for
  // why), which a static headers() entry can't produce. Setting it in both
  // places would leave two competing CSP headers on the same response.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // frame-ancestors (set in middleware.ts's CSP) already blocks
          // framing in CSP-aware browsers; X-Frame-Options is kept alongside
          // it for older browsers that don't understand frame-ancestors at all.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // HSTS only makes sense once the site is actually always served
          // over HTTPS — local dev over plain http would have no effect
          // either way (browsers ignore this header outside https), but
          // scoping it to production keeps intent explicit.
          ...(isProduction
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
            : []),
        ],
      },
    ];
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ihiga-lite/shared"],
  images: {
    // Temporary Unsplash placeholders in the homepage's "How it works"
    // feature section — swap for real photos, then this can be removed.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

module.exports = nextConfig;

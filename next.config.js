const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    // ✅ Fix local dev ENOTFOUND (cdn.atxsolutions.com has no DNS yet)
    // In dev, Next won't try to fetch/optimize remote images server-side.
    unoptimized: process.env.NODE_ENV === "development",

    remotePatterns: [
      { protocol: "https", hostname: "cdn.atxsolutions.com", pathname: "/**" },
      {
        protocol: "https",
        hostname: "tkdhzhohwsvyvlbdochd.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
};

module.exports = withPWA(nextConfig);

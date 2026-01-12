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
    remotePatterns: [
      { protocol: "https", hostname: "cdn.atxsolutions.com", pathname: "/**" },
      {
        protocol: "https",
        hostname: "tkdhzhohwsvyvlbdochd.supabase.co",
        pathname: "/**",
      },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      // ✅ ADD THIS
      {
        protocol: "https",
        hostname: "tkdhzhohwsvyvlbdochd.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

module.exports = withPWA(nextConfig);

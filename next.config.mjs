import crypto from "crypto";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Guarantee a unique build ID on every dev restart so stale chunk
  // references from a previous .next build are never served.
  generateBuildId: async () => crypto.randomUUID(),
  // The archive route was renamed from /test to /collection. Redirect any
  // lingering references so there are no broken routes in production.
  async redirects() {
    return [
      { source: "/test", destination: "/collection", permanent: true },
    ];
  },
  async headers() {
    return [
      // Security headers on every response
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=(), payment=()" },
          { key: "Content-Security-Policy-Report-Only", value: "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://res.cloudinary.com https://plasmic.app" },
        ],
      },
      // Immutable cache for Next.js hashed static chunks (JS/CSS)
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // ISR pages: serve from CDN edge for 1 hour, then revalidate in background
      {
        source: "/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;

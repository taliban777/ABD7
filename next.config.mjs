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
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
        ],
      },
    ];
  },
};

export default nextConfig;

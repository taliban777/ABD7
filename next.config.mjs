import crypto from "crypto";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Guarantee a unique build ID on every dev restart so stale chunk
  // references from a previous .next build are never served.
  generateBuildId: async () => crypto.randomUUID(),
};

export default nextConfig;

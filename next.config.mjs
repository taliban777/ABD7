/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep generated output isolated from stale `.next` artifacts restored during branch syncs.
  distDir: ".next-v0",
};

export default nextConfig;

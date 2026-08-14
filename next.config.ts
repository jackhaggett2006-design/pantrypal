import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to be used from other devices on the local network
  // (e.g. testing on a phone via the Mac's LAN IP). Next.js blocks cross-origin
  // dev requests by default, which breaks interactivity when opened by IP.
  allowedDevOrigins: ["192.168.4.110", "*.local"],
};

export default nextConfig;

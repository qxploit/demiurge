import type { NextConfig } from "next";

// Proxy /api/* to the NestJS backend so the whole app is served from one
// origin (works locally and through a single Cloudflare tunnel).
const API_TARGET = process.env.API_PROXY_TARGET ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  devIndicators: false,
  skipTrailingSlashRedirect: true,
  // let the dev server accept the cloudflare tunnel origin (else it blocks /_next/*)
  allowedDevOrigins: ["*.trycloudflare.com"], // let socket.io's /gamesock/ pass through to the rewrite
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_TARGET}/:path*` },
      { source: "/gamesock", destination: `${API_TARGET}/gamesock` },
      { source: "/gamesock/:path*", destination: `${API_TARGET}/gamesock/:path*` },
    ];
  },
};

export default nextConfig;

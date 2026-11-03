import type { NextConfig } from "next";

/** /icinden v3 klip ve posterleri: adlarında içerik özeti var (scripts/icinden/kodla.mjs) → kalıcı önbellek. */
const KALICI = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/icinden/v/:path*", headers: KALICI },
      { source: "/icinden/p/:path*", headers: KALICI },
    ];
  },
};

export default nextConfig;

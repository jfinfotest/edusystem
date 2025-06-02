import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"]
  },
  env: {
    TZ: 'UTC',
  }
};

export default nextConfig;

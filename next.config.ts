import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // Lint dijalankan terpisah lewat `bun run lint`
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Pastikan engine + client Prisma ikut dalam standalone output (dibutuhkan packaging .exe)
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/.prisma/client/**", "./node_modules/@prisma/client/**"],
  },
};

export default nextConfig;

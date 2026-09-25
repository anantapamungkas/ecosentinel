import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ["src"],
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;

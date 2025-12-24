import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure static files are properly served
  images: {
    domains: [],
  },
  // Set Turbopack root to silence workspace warning
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

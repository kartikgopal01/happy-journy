import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure static files are properly served
  images: {
    domains: [],
  },
};

export default nextConfig;

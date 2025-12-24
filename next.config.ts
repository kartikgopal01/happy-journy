import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure static files are properly served
  images: {
    domains: [],
  },
  // Set Turbopack root to silence workspace warning (only for local dev)
  ...(process.env.NODE_ENV === "development" && {
    turbopack: {
      root: path.resolve(__dirname),
    },
  }),
  // Set output file tracing root to silence lockfile warning
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;

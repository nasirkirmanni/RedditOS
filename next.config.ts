import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray package-lock.json exists in the user profile dir; pin the root here.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

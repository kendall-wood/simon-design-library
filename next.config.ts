import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Commented out for YouTube Feed API routes to work
  // If you need static export, you'll need to deploy with a server (Vercel, etc.)
  // output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

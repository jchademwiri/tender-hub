import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure App Router-related experimental options
  experimental: {
    // Optimize package imports for better performance
    optimizePackageImports: ['lucide-react', '@radix-ui/react-slot'],
  },
  // Enable standalone build for containerized/Docker deployments
  output: 'standalone',
};

export default nextConfig;

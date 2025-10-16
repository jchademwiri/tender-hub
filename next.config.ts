import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly configure for App Router
  experimental: {
    // Ensure we're using the latest App Router features
    optimizePackageImports: ['lucide-react', '@radix-ui/react-slot'],
  },
  // Disable Pages Router features that might cause conflicts
  output: 'standalone',
  // Ensure proper handling of environment variables
  env: {
    // This helps with Edge Runtime compatibility
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure App Router-related experimental options
  experimental: {
    // Optimize package imports for better performance
    optimizePackageImports: ["lucide-react", "@radix-ui/react-slot"],
  },
  // Enable standalone build for containerized/Docker deployments
  output: "standalone",

  // Production security headers
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";

    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "payment=()",
              "usb=()",
              "magnetometer=()",
              "gyroscope=()",
              "accelerometer=()",
              "ambient-light-sensor=()",
              "autoplay=()",
              "encrypted-media=()",
              "fullscreen=(self)",
              "picture-in-picture=()",
            ].join(", "),
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Allow scripts from self and necessary inline scripts for Next.js
              isDevelopment
                ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
                : "script-src 'self' 'unsafe-inline'",
              // Allow styles from self and inline styles for CSS-in-JS
              "style-src 'self' 'unsafe-inline'",
              // Allow images from self, data URLs, and HTTPS sources
              "img-src 'self' data: https:",
              // Allow fonts from self only
              "font-src 'self'",
              // Allow connections to self and necessary external APIs
              "connect-src 'self' https://api.resend.com",
              // Prevent framing
              "frame-ancestors 'none'",
              // Allow forms to submit to self
              "form-action 'self'",
              // Prevent object/embed tags
              "object-src 'none'",
              // Allow media from self
              "media-src 'self'",
              // Prevent plugins
              "plugin-types",
              // Require HTTPS for all resources in production
              ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
            ].join("; "),
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "off",
          },
          {
            key: "X-Download-Options",
            value: "noopen",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
        ],
      },
      // API routes get additional security headers
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
          {
            key: "Surrogate-Control",
            value: "no-store",
          },
        ],
      },
    ];
  },

  // Redirect HTTP to HTTPS in production
  async redirects() {
    if (process.env.NODE_ENV === "production") {
      return [
        {
          source: "/(.*)",
          has: [
            {
              type: "header",
              key: "x-forwarded-proto",
              value: "http",
            },
          ],
          destination: "https://:host/:path*",
          permanent: true,
        },
      ];
    }
    return [];
  },

  // Optimize images
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },

  // Compress responses
  compress: true,

  // SWC minification is enabled by default in Next.js 13+

  // Power by header removal for security
  poweredByHeader: false,
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — produces HTML/CSS/JS only, no Node.js server needed
  // This is critical for keeping the Electron app size small (~60-80MB vs 500MB+)
  output: "export",

  // Disable server images in Electron (file system works differently)
  images: {
    unoptimized: true,
  },

  // Build settings optimized for Electron packaging
  typescript: {
    ignoreBuildErrors: false,
  },

  reactStrictMode: false,

  // Allow cross-origin for dev preview
  allowedDevOrigins: [
    'space-z.ai',
  ],

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'date-fns',
    ],
  },
};

export default nextConfig;

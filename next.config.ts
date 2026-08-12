import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

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
      'recharts',
      'date-fns',
    ],
  },
};

export default nextConfig;

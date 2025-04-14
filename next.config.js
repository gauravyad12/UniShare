/** @type {import('next').NextConfig} */

const nextConfig = {
  // Disable webpack caching to prevent ENOENT errors
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  // Set server port from environment variable
  serverRuntimeConfig: {
    port: process.env.PORT || 3000,
  },
  env: {
    PORT: process.env.PORT || 3000,
    // Ensure we're only using .env file values
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Enable SWC minification
  swcMinify: true,
  // Disable React strict mode to prevent double rendering
  reactStrictMode: false,
  // IMPORTANT: DO NOT use distDir or output with Next.js 14+ as it causes 404 errors
  // Enable middleware
  skipMiddlewareUrlNormalize: false,
  skipTrailingSlashRedirect: false,
  // Configure experimental features
  experimental: {
    serverComponentsExternalPackages: [],
    serverActions: {
      bodySizeLimit: "4mb",
    },
    // Disable some features that might cause issues
    optimizeCss: false,
    optimizePackageImports: [],
    // Configure page data size
    largePageDataBytes: 128 * 1000, // 128KB
  },
  // Disable powered by header
  poweredByHeader: false,
  // Increase buffer size for responses
  httpAgentOptions: {
    keepAlive: true,
  },
  // Increase static generation timeout
  staticPageGenerationTimeout: 180,
  // Adjust image settings
  images: {
    domains: ["images.unsplash.com", "api.dicebear.com"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ["image/webp"],
  },
  // Compress responses
  compress: true,
  // Increase memory limit
  onDemandEntries: {
    maxInactiveAge: 120 * 1000, // 120 seconds
    pagesBufferLength: 5,
  },
  // Disable strict mode for API routes
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

// Configure SWC plugins for Tempo - only in development
if (process.env.NEXT_PUBLIC_TEMPO && process.env.NODE_ENV === 'development') {
  // Preserve existing experimental settings
  const currentExperimental = nextConfig.experimental || {};

  nextConfig["experimental"] = {
    ...currentExperimental,
    // NextJS 14.2.x
    swcPlugins: [[require.resolve("tempo-devtools/swc/0.90"), {}]],
  };
}

module.exports = nextConfig;

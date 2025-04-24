/** @type {import('next').NextConfig} */

const nextConfig = {
  // Disable static generation for all routes
  output: 'standalone',
  distDir: '.next',
  // Disable static generation completely
  experimental: {
    // Existing experimental settings
    serverComponentsExternalPackages: [],
    serverActions: {
      bodySizeLimit: "4mb",
    },
    // Disable some features that might cause issues
    optimizeCss: false,
    optimizePackageImports: [],
    // Configure page data size
    largePageDataBytes: 128 * 1000, // 128KB
    // Disable CSR bailout warning
    missingSuspenseWithCSRBailout: false,
  },
  // Disable static generation
  cacheHandler: require.resolve('./disable-cache.js'),
  // Disable static export
  // We're not using exportPathMap
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
    PORT: process.env.PORT || "3000",
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
  // Configure experimental features - moved to the top
  // Disable powered by header
  poweredByHeader: false,
  // Increase buffer size for responses
  httpAgentOptions: {
    keepAlive: true,
  },
  // Disable static generation completely
  staticPageGenerationTimeout: 1,
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

module.exports = nextConfig;

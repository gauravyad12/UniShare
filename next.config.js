/** @type {import('next').NextConfig} */

const nextConfig = {
  // Use standalone output for production builds
  output: 'standalone',
  distDir: '.next',
  // Force dynamic rendering for all pages
  staticPageGenerationTimeout: 1,
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
  // Configure on-demand entries
  onDemandEntries: {
    maxInactiveAge: 120 * 1000, // 120 seconds
    pagesBufferLength: 5,
  },
  // Disable static generation
  cacheHandler: require.resolve('./disable-cache.js'),
  // Disable static export
  // We're not using exportPathMap
  // Disable webpack caching to prevent ENOENT errors and suppress warnings
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.cache = false;
    }

    // Suppress warnings
    config.infrastructureLogging = {
      level: 'error',
    };

    // Ignore specific warnings
    if (!isServer) {
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions.compress.warnings = false;
        }
      });
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
    NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY: process.env.GOOGLE_BOOKS_API_KEY,
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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com"
      },
      {
        protocol: "https",
        hostname: "covers.openlibrary.org"
      },
      {
        protocol: "http",
        hostname: "covers.openlibrary.org"
      },
      {
        protocol: "https",
        hostname: "archive.org"
      },
      {
        protocol: "http",
        hostname: "archive.org"
      },
      {
        protocol: "https",
        hostname: "*.archive.org"
      },
      {
        protocol: "http",
        hostname: "*.archive.org"
      },
      {
        protocol: "https",
        hostname: "books.google.com"
      },
      {
        protocol: "http",
        hostname: "books.google.com"
      },
      {
        protocol: "https",
        hostname: "books.googleusercontent.com"
      },
      {
        protocol: "http",
        hostname: "books.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org"
      },
      {
        protocol: "https",
        hostname: "*.wikimedia.org"
      },
      {
        protocol: "https",
        hostname: "*.wikipedia.org"
      },
      {
        protocol: "https",
        hostname: "cdn-icons-png.freepik.com"
      },
      {
        protocol: "https",
        hostname: "*.freepik.com"
      }
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ["image/webp"],
  },
  // Compress responses
  compress: true,
  // Memory limit configuration moved to the top
  // Disable strict mode for API routes
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

};

module.exports = nextConfig;

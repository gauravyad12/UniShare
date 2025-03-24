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
  // Disable SWC minification to prevent module resolution issues
  swcMinify: false,
  // Disable React strict mode to prevent double rendering
  reactStrictMode: false,
  // Explicitly set the output mode
  output: "standalone",
  // Disable middleware temporarily
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,
};

// Configure SWC plugins for Tempo
if (process.env.NEXT_PUBLIC_TEMPO) {
  nextConfig["experimental"] = {
    // NextJS 14.2.x
    swcPlugins: [[require.resolve("tempo-devtools/swc/0.90"), {}]],
  };
}

module.exports = nextConfig;

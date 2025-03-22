/** @type {import('next').NextConfig} */

const nextConfig = {
  // Disable webpack caching to prevent ENOENT errors
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  // Explicitly set the port to 5000
  serverRuntimeConfig: {
    port: 5000,
  },
  publicRuntimeConfig: {
    port: 5000,
  },
};

// Set the server port to avoid EADDRINUSE errors
process.env.PORT = "5000";

if (process.env.NEXT_PUBLIC_TEMPO) {
  nextConfig["experimental"] = {
    // NextJS 13.4.8 up to 14.1.3:
    // swcPlugins: [[require.resolve("tempo-devtools/swc/0.86"), {}]],
    // NextJS 14.1.3 to 14.2.11:
    swcPlugins: [[require.resolve("tempo-devtools/swc/0.90"), {}]],

    // NextJS 15+ (Not yet supported, coming soon)
  };
}

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          path: false,
          os: false,
          crypto: false,
        };
      }
      // Suppress pino-pretty warnings
      config.ignoreWarnings = [
        { module: /node_modules\/pino\/lib\/tools\.js/ },
        { module: /node_modules\/ox\/_esm\/tempo\/internal\/virtualMasterPool\.js/ },
      ];
      return config;
    },
    experimental: {
      serverComponentsExternalPackages: ['@arcium-hq/client'],
    },
  };
  
  export default nextConfig;
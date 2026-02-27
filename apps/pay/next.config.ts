import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@zkira/common', '@zkira/crypto', '@zkira/sdk'],
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3012/api/:path*',
      },
    ];
  },
  // Use webpack for build (Turbopack doesn't support Buffer polyfill config)
  webpack: (config) => {
    // Buffer polyfill for @solana/web3.js and @zkira/sdk in browser
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      buffer: require.resolve('buffer/'),
    };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webpack = require('webpack');
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      })
    );
    return config;
  },
};

export default nextConfig;
